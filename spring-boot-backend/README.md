# Campus Lost & Found — Backend (Spring Boot 3 + MySQL + JWT)

This folder contains the backend implementation for the **Campus Lost & Found** application built with **Java 21**, **Spring Boot 3.3.4**, **Maven**, **Spring Security 6**, **Jakarta Bean Validation**, **JWT Authentication**, and **MySQL 8.0**.

## Contents
- `pom.xml` — Maven configuration with Spring Web, Spring Data JPA, Spring Security, Jakarta Validation, JJWT (`0.12.5`), and MySQL Connector/J.
- `src/main/resources/schema.sql` — Complete MySQL 8.0 relational database schema (`users`, `collection_hubs`, `item_reports`, `ownership_claims`, `notifications`).
- `src/main/resources/application.properties` — MySQL JDBC connection settings, Hibernate configuration, and JWT secret/expiration properties.
- `src/main/java/edu/campus/lostfound/security/SecurityConfig.java` — Stateless JWT security filter chain and role-based endpoint authorization (`OWNER`, `FINDER`, `ADMIN_SECURITY`).
- `src/main/java/edu/campus/lostfound/dto/ItemReportRequest.java` — Request DTO with Jakarta Bean Validation annotations (`@NotBlank`, `@Size`, `@Pattern`, `@NotNull`).
- `src/main/java/edu/campus/lostfound/controller/ItemReportController.java` — REST controller for searching, reporting, and logging fixed collection hub intake.
- `../server.ts` — Express + TypeScript runtime API server implementing the exact `/api/v1/*` contract for instant preview execution.

## Quick Start (Spring Boot + MySQL)
1. Create the database tables in MySQL 8.0:
   ```bash
   mysql -u root -p < src/main/resources/schema.sql
   ```
2. Configure your MySQL credentials in `src/main/resources/application.properties`.
3. Run the Spring Boot server:
   ```bash
   mvn clean spring-boot:run
   ```
