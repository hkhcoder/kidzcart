using AchievementsService.Models;
using AchievementsService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AchievementsService.Controllers;

[ApiController]
[Route("achievements")]
[Authorize]
public class AchievementsController : ControllerBase
{
    private readonly AchievementOrchestrator _orchestrator;
    private readonly CertificatePdfRenderer _certificatePdf;

    public AchievementsController(AchievementOrchestrator orchestrator, CertificatePdfRenderer certificatePdf)
    {
        _orchestrator = orchestrator;
        _certificatePdf = certificatePdf;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe(CancellationToken cancellationToken)
    {
        var outcome = await _orchestrator.LoadAsync(User, cancellationToken);
        return outcome switch
        {
            AchievementsLoadSuccess s => Ok(new AchievementsMeResponse(s.Donations, s.Certificate)),
            AchievementsUnauthorized => Unauthorized(),
            AchievementsUpstreamError e => StatusCode(e.StatusCode, new { message = e.Message, detail = e.Detail }),
            _ => Problem(statusCode: 500)
        };
    }

    [HttpGet("me/certificate")]
    public async Task<IActionResult> GetCertificate(CancellationToken cancellationToken)
    {
        var outcome = await _orchestrator.LoadAsync(User, cancellationToken);
        if (outcome is AchievementsUnauthorized)
            return Unauthorized();
        if (outcome is AchievementsUpstreamError e)
            return StatusCode(e.StatusCode, new { message = e.Message, detail = e.Detail });
        if (outcome is not AchievementsLoadSuccess s)
            return Problem(statusCode: 500);

        var bytes = _certificatePdf.Render(s.Certificate);
        return File(bytes, "application/pdf", fileDownloadName: "Certificate.pdf");
    }
}
