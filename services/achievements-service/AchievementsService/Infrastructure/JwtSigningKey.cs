using System.Security.Cryptography;
using System.Text;

namespace AchievementsService.Infrastructure;

/// <summary>
/// HS256 signing key matches Java marketplace-service: if secret UTF-8 length &lt; 32, SHA-512 hash (64 bytes); otherwise raw bytes.
/// </summary>
public static class JwtSigningKey
{
    public static byte[] GetBytes(string secret)
    {
        var bytes = Encoding.UTF8.GetBytes(secret);
        if (bytes.Length >= 32)
            return bytes;
        return SHA512.HashData(bytes);
    }
}
