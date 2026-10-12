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
@Table(name = "ownership_claims")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnershipClaim {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "claim_code", nullable = false, unique = true, length = 24)
    private String claimCode;

    @Column(name = "item_id", nullable = false, length = 36)
    private String itemId;

    @Column(name = "item_reference_code", nullable = false, length = 24)
    private String itemReferenceCode;

    @Column(name = "item_title", nullable = false, length = 140)
    private String itemTitle;

    @Column(name = "item_type", length = 16)
    private String itemType;

    @Column(name = "claimant_user_id", nullable = false, length = 36)
    private String claimantUserId;

    @Column(name = "claimant_name", nullable = false, length = 100)
    private String claimantName;

    @Column(name = "claimant_email", nullable = false, length = 120)
    private String claimantEmail;

    @Column(name = "claimant_campus_id", nullable = false, length = 32)
    private String claimantCampusId;

    @Lob
    @Column(name = "verification_answer", nullable = false, columnDefinition = "TEXT")
    private String verificationAnswer;

    @Lob
    @Column(name = "proof_description", nullable = false, columnDefinition = "TEXT")
    private String proofDescription;

    @Column(name = "serial_or_id_number", length = 100)
    private String serialOrIdNumber;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "reviewed_by_officer", length = 100)
    private String reviewedByOfficer;

    @Lob
    @Column(name = "officer_remarks", columnDefinition = "TEXT")
    private String officerRemarks;

    @Column(name = "pickup_pass_code", length = 32)
    private String pickupPassCode;

    @Column(name = "collection_hub_name", length = 120)
    private String collectionHubName;

    @Column(name = "locker_bin", length = 32)
    private String lockerBin;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "handed_over_at")
    private Instant handedOverAt;
}
