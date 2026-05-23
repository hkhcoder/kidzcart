using System.Text.Json;
using AchievementsService.Models;

namespace AchievementsService.Services;

public abstract record AchievementsLoadOutcome;

public record AchievementsLoadSuccess(JsonElement Donations, CertificateDto Certificate) : AchievementsLoadOutcome;

public record AchievementsUnauthorized : AchievementsLoadOutcome;

public record AchievementsUpstreamError(int StatusCode, string Message, string Detail) : AchievementsLoadOutcome;
