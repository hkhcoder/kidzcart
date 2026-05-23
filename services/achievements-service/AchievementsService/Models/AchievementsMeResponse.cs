using System.Text.Json;

namespace AchievementsService.Models;

public record AchievementsMeResponse(JsonElement Donations, CertificateDto Certificate);
