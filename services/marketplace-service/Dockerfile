# =============================================================================
# Stage 1 — Build with Maven
# =============================================================================
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Download dependencies first (layer-cached unless pom.xml changes)
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build (skip tests — run them in CI separately)
COPY src ./src
RUN mvn package -DskipTests -q

# =============================================================================
# Stage 2 — Minimal JRE runtime
# =============================================================================
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Install curl for health check
RUN apk add --no-cache curl

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy the fat JAR produced by spring-boot-maven-plugin
COPY --from=builder /app/target/marketplace-service-*.jar app.jar

EXPOSE 4001

ENTRYPOINT ["java", "-jar", "app.jar"]
