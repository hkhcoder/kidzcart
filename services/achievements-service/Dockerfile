# =============================================================================
# Stage 1 — Build with .NET SDK
# =============================================================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder

WORKDIR /src

# Restore dependencies first (layer-cached unless .csproj changes)
COPY AchievementsService/AchievementsService.csproj AchievementsService/
RUN dotnet restore AchievementsService/AchievementsService.csproj

# Copy source and publish
COPY AchievementsService/ AchievementsService/
RUN dotnet publish AchievementsService/AchievementsService.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# =============================================================================
# Stage 2 — Debian-slim runtime
# QuestPDF (PDF generation) requires native font/graphics libraries that are
# not present in the alpine variant — use the full Debian-slim image instead.
# =============================================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

# Install curl for health check + fonts required by QuestPDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    fontconfig \
    libfreetype6 \
    libharfbuzz0b \
    && rm -rf /var/lib/apt/lists/*

# Copy published output (done as root so files are readable)
COPY --from=builder /app/publish .

# Non-root user for security (created after COPY so ownership is correct)
RUN groupadd -r appgroup && useradd -r -g appgroup appuser \
    && chown -R appuser:appgroup /app
USER appuser

# Override the appsettings.json Urls binding — listen on all interfaces in container
ENV ASPNETCORE_URLS=http://+:4006
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 4006

ENTRYPOINT ["dotnet", "AchievementsService.dll"]
