namespace AchievementsService.Models;

public record CertificateDto(
    string CertificateId,
    string Title,
    string Subtitle,
    string RecipientName,
    string Body,
    string IssuedAt,
    string IssuedAtDisplay,
    int DonationCount,
    string IssuerName,
    string Quote
);
