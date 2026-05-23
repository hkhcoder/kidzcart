using AchievementsService.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AchievementsService.Services;

/// <summary>
/// Renders a printable certificate as PDF (QuestPDF, community license).
/// </summary>
public sealed class CertificatePdfRenderer
{
    private static readonly Color Gold = Color.FromHex("#c9a227");
    private static readonly Color Cream = Color.FromHex("#fffefb");
    private static readonly Color Slate900 = Color.FromHex("#0f172a");
    private static readonly Color Slate700 = Color.FromHex("#334155");
    private static readonly Color Slate500 = Color.FromHex("#64748b");
    private static readonly Color Slate400 = Color.FromHex("#94a3b8");
    private static readonly Color Blue = Color.FromHex("#4361ee");
    private static readonly Color Green = Color.FromHex("#059669");

    public byte[] Render(CertificateDto c)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(36);
                page.PageColor(Color.FromHex("#f0f4ff"));
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily(Fonts.TimesNewRoman));

                page.Content().Column(main =>
                {
                    main.Spacing(0);
                    main
                        .Item()
                        .Background(Cream)
                        .Border(3)
                        .BorderColor(Gold)
                        .Padding(8)
                        .Border(1)
                        .BorderColor(Gold)
                        .Padding(36)
                        .Column(inner =>
                        {
                            inner.Spacing(10);
                            inner
                                .Item()
                                .AlignRight()
                                .Text($"No. {c.CertificateId}")
                                .FontSize(9)
                                .FontColor(Slate500)
                                .LetterSpacing(0.06f);

                            inner.Item().AlignCenter().Text("✦").FontSize(26).FontColor(Gold);

                            inner
                                .Item()
                                .AlignCenter()
                                .Text(c.Title)
                                .Bold()
                                .FontSize(18)
                                .FontColor(Slate900)
                                .LetterSpacing(0.12f);

                            inner
                                .Item()
                                .AlignCenter()
                                .Text(c.Subtitle)
                                .FontSize(10)
                                .FontColor(Slate500)
                                .SemiBold();

                            inner
                                .Item()
                                .PaddingTop(6)
                                .AlignCenter()
                                .Text("Presented to")
                                .FontSize(9)
                                .Bold()
                                .FontColor(Slate400)
                                .LetterSpacing(0.2f);

                            inner
                                .Item()
                                .AlignCenter()
                                .Text(c.RecipientName)
                                .Bold()
                                .FontSize(22)
                                .FontColor(Blue);

                            inner
                                .Item()
                                .AlignCenter()
                                .Text(c.Body)
                                .FontSize(11)
                                .LineHeight(1.55f)
                                .FontColor(Slate700);

                            inner
                                .Item()
                                .AlignCenter()
                                .Text($"Recorded donations: {c.DonationCount}")
                                .Bold()
                                .FontSize(11)
                                .FontColor(Green);

                            inner
                                .Item()
                                .PaddingTop(14)
                                .BorderTop(1)
                                .BorderColor(Color.FromHex("#94a3b8"))
                                .PaddingTop(14)
                                .Row(row =>
                                {
                                    row.RelativeItem().Column(left =>
                                    {
                                        left.Item().Text(c.IssuerName).Bold().FontSize(10).FontColor(Slate900);
                                        left.Item().Text(c.Quote).Italic().FontSize(9).FontColor(Slate400);
                                    });
                                    row.RelativeItem().AlignRight().Text($"Issued {c.IssuedAtDisplay}").FontSize(9).FontColor(Slate500);
                                });
                        });
                });
            });
        }).GeneratePdf();
    }
}
