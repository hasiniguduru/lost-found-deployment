package edu.campus.lostfound.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "item_reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemReport {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "reference_code", nullable = false, unique = true, length = 24)
    private String referenceCode;

    @Column(nullable = false, length = 140)
    private String title;

    @Column(nullable = false, length = 16)
    private String type;

    @Column(nullable = false, length = 64)
    private String category;

    @Column(name = "campus_zone", nullable = false, length = 100)
    private String campusZone;

    @Column(name = "specific_location", nullable = false, length = 160)
    private String specificLocation;

    @Column(name = "date_occurred", nullable = false, length = 32)
    private String dateOccurred;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "distinguishing_features", length = 255)
    private String distinguishingFeatures;

    @Column(name = "verification_question", nullable = false, length = 255)
    private String verificationQuestion;

    @Column(name = "expected_verification_hint", length = 255)
    private String expectedVerificationHint;

    @Column(name = "custody_status", nullable = false, length = 32)
    private String custodyStatus;

    @Column(name = "hub_id", length = 36)
    private String hubId;

    @Column(name = "hub_name", length = 120)
    private String hubName;

    @Column(name = "locker_bin", length = 32)
    private String lockerBin;

    @Column(name = "submission_receipt_code", length = 32)
    private String submissionReceiptCode;

    @Lob
    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Column(name = "reported_by_user_id", nullable = false, length = 36)
    private String reportedByUserId;

    @Column(name = "reported_by_name", nullable = false, length = 100)
    private String reportedByName;

    @Column(name = "reported_by_campus_id", nullable = false, length = 32)
    private String reportedByCampusId;

    @Column(name = "reported_by_role", nullable = false, length = 32)
    private String reportedByRole;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
