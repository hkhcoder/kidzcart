using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AchievementsService.Models;

namespace AchievementsService.Services;

public class AchievementOrchestrator
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _configuration;

    public AchievementOrchestrator(IHttpClientFactory httpFactory, IConfiguration configuration)
    {
        _httpFactory = httpFactory;
        _configuration = configuration;
    }

    private string DonationsBaseUrl =>
        (_configuration["DONATIONS_SERVICE_URL"] ?? _configuration["DonationsApi:BaseUrl"] ?? "http://127.0.0.1:4002")
            .TrimEnd('/');

    public async Task<AchievementsLoadOutcome> LoadAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var userId =
            principal.FindFirstValue("userId") ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (string.IsNullOrWhiteSpace(userId))
            return new AchievementsUnauthorized();

        var name =
            principal.FindFirstValue("name")
            ?? principal.FindFirstValue(JwtRegisteredClaimNames.Email)
            ?? "Friend";

        var baseUrl = DonationsBaseUrl;
        var client = _httpFactory.CreateClient();
        var url = $"{baseUrl}/donations?userId={Uri.EscapeDataString(userId)}";
        using var resp = await client.GetAsync(url, cancellationToken);
        if (!resp.IsSuccessStatusCode)
        {
            var detail = await resp.Content.ReadAsStringAsync(cancellationToken);
            return new AchievementsUpstreamError((int)resp.StatusCode, "Failed to load donations", detail);
        }

        var json = await resp.Content.ReadAsStringAsync(cancellationToken);
        var donations = JsonSerializer.Deserialize<JsonElement>(
            json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );

        var count = 0;
        if (donations.ValueKind == JsonValueKind.Array)
            count = donations.GetArrayLength();

        var certId = CertificateIdFor(userId);
        var issuedUtc = DateTime.UtcNow;
        var certificate = new CertificateDto(
            CertificateId: certId,
            Title: "Certificate of Kindness",
            Subtitle: "KidzCart · Community Giving",
            RecipientName: name,
            Body:
                count == 0
                    ? $"{name} is recognized as a valued member of the KidzCart community. Every act of giving starts with a single step — thank you for being here."
                    : $"In recognition of compassionate giving: {name} has contributed {count} donation record(s) through KidzCart, helping families and children in our community.",
            IssuedAt: issuedUtc.ToString("O"),
            IssuedAtDisplay: issuedUtc.ToString("MMMM d, yyyy", CultureInfo.InvariantCulture) + " (UTC)",
            DonationCount: count,
            IssuerName: "KidzCart",
            Quote: "Shop · Share · Smile"
        );

        return new AchievementsLoadSuccess(donations, certificate);
    }

    private static string CertificateIdFor(string userId)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes($"km-cert|{userId}"));
        return Convert.ToHexString(hash.AsSpan(0, 8)).ToLowerInvariant();
    }
}
