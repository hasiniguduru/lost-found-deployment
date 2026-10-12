package edu.campus.lostfound.controller;

import edu.campus.lostfound.entity.CollectionHub;
import edu.campus.lostfound.entity.ItemReport;
import edu.campus.lostfound.entity.Notification;
import edu.campus.lostfound.entity.OwnershipClaim;
import edu.campus.lostfound.repository.CollectionHubRepository;
import edu.campus.lostfound.repository.ItemReportRepository;
import edu.campus.lostfound.repository.NotificationRepository;
import edu.campus.lostfound.repository.OwnershipClaimRepository;
import edu.campus.lostfound.security.CampusUserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/v1/claims")
@RequiredArgsConstructor
public class OwnershipClaimController {

    private final OwnershipClaimRepository ownershipClaimRepository;
    private final ItemReportRepository itemReportRepository;
    private final CollectionHubRepository collectionHubRepository;
    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<?> listClaims() {
        return ResponseEntity.ok(ownershipClaimRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping
    public ResponseEntity<?> createClaim(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal CampusUserPrincipal principal
    ) {
        String itemId = payload != null ? payload.get("itemId") : null;
        String verificationAnswer = payload != null ? payload.getOrDefault("verificationAnswer", "").trim() : "";
        String proofDescription = payload != null ? payload.getOrDefault("proofDescription", "").trim() : "";
        String serialOrIdNumber = payload != null ? payload.getOrDefault("serialOrIdNumber", "Provided at Desk").trim() : "Provided at Desk";

        Map<String, String> fieldErrors = new HashMap<>();
        if (itemId == null || itemId.isBlank()) {
            fieldErrors.put("itemId", "Target item report ID is required");
        }
        if (verificationAnswer.length() < 5) {
            fieldErrors.put("verificationAnswer", "Please provide a specific answer to the verification question (min 5 characters)");
        }
        if (proofDescription.length() < 8) {
            fieldErrors.put("proofDescription", "Supporting proof of ownership description is required (min 8 characters)");
        }
        if (!fieldErrors.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "timestamp", Instant.now().toString(),
                    "status", 400,
                    "error", "MethodArgumentNotValidException",
                    "fieldErrors", fieldErrors
            ));
        }

        ItemReport item = itemReportRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item report not found"));

        String claimCode = "CLM-2026-" + (301 + ownershipClaimRepository.count());

        OwnershipClaim claim = OwnershipClaim.builder()
                .id("clm-" + UUID.randomUUID().toString().substring(0, 8))
                .claimCode(claimCode)
                .itemId(item.getId())
                .itemReferenceCode(item.getReferenceCode())
                .itemTitle(item.getTitle())
                .itemType(item.getType())
                .claimantUserId(principal != null ? principal.getId() : "usr-owner-01")
                .claimantName(principal != null ? principal.getFullName() : "Campus Student")
                .claimantEmail(principal != null ? principal.getEmail() : "student@campus.edu")
                .claimantCampusId(principal != null ? principal.getCampusId() : "STU-2026-4819")
                .verificationAnswer(verificationAnswer)
                .proofDescription(proofDescription)
                .serialOrIdNumber(serialOrIdNumber.isBlank() ? "Provided at Desk" : serialOrIdNumber)
                .status("PENDING_VERIFICATION")
                .collectionHubName(item.getHubName() != null ? item.getHubName() : "Security Desk 1")
                .lockerBin(item.getLockerBin() != null ? item.getLockerBin() : "Bin S1-09")
                .createdAt(Instant.now())
                .build();

        OwnershipClaim saved = ownershipClaimRepository.save(claim);

        Notification notif = Notification.builder()
                .id("ntf-" + UUID.randomUUID().toString().substring(0, 8))
                .recipientUserId(saved.getClaimantUserId())
                .recipientRole("ALL")
                .title("Ownership Claim " + claimCode + " Submitted for Verification")
                .message(saved.getClaimantName() + " (" + saved.getClaimantCampusId() + ") submitted ownership verification for \"" + item.getTitle() + "\" (" + item.getReferenceCode() + ").")
                .category("VERIFICATION_UPDATE")
                .relatedItemId(item.getId())
                .actionCode(claimCode)
                .isRead(false)
                .createdAt(Instant.now())
                .build();
        notificationRepository.save(notif);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PatchMapping("/{id}/verify")
    public ResponseEntity<?> verifyClaim(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal CampusUserPrincipal principal
    ) {
        OwnershipClaim claim = ownershipClaimRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Claim not found"));

        String decision = payload != null ? payload.getOrDefault("decision", "APPROVED") : "APPROVED";
        String officerRemarks = payload != null ? payload.getOrDefault("officerRemarks", "") : "";

        claim.setStatus(decision);
        claim.setReviewedByOfficer(principal != null ? principal.getFullName() : "Campus Security");
        claim.setOfficerRemarks(
                officerRemarks != null && !officerRemarks.isBlank()
                        ? officerRemarks.trim()
                        : ("APPROVED".equalsIgnoreCase(decision)
                            ? "Ownership answers and Campus ID verified. Cleared for fixed collection desk pickup."
                            : "Verification details did not match custody item identifiers.")
        );
        claim.setVerifiedAt(Instant.now());

        if ("APPROVED".equalsIgnoreCase(decision)) {
            String binSuffix = (claim.getLockerBin() != null ? claim.getLockerBin() : "B01").replaceAll("[^A-Za-z0-9]", "");
            String passCode = "PKP-" + ThreadLocalRandom.current().nextInt(1000, 9999) + "-" + binSuffix;
            claim.setPickupPassCode(passCode);
            itemReportRepository.findById(claim.getItemId()).ifPresent(item -> {
                item.setCustodyStatus("CLAIM_APPROVED");
                itemReportRepository.save(item);
            });

            Notification notif = Notification.builder()
                    .id("ntf-" + UUID.randomUUID().toString().substring(0, 8))
                    .recipientUserId(claim.getClaimantUserId())
                    .recipientRole("ALL")
                    .title("Ownership Approved — Pickup Pass " + passCode)
                    .message("Claim " + claim.getClaimCode() + " for \"" + claim.getItemTitle() + "\" was approved. Collect your item at " + claim.getCollectionHubName() + " (" + claim.getLockerBin() + ") with Pass " + passCode + ".")
                    .category("PICKUP_READY")
                    .relatedItemId(claim.getItemId())
                    .actionCode(passCode)
                    .isRead(false)
                    .createdAt(Instant.now())
                    .build();
            notificationRepository.save(notif);
        }

        return ResponseEntity.ok(ownershipClaimRepository.save(claim));
    }

    @PatchMapping("/{id}/handover")
    public ResponseEntity<?> completeHandover(@PathVariable String id) {
        OwnershipClaim claim = ownershipClaimRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Claim not found"));

        claim.setStatus("HANDED_OVER");
        claim.setHandedOverAt(Instant.now());

        itemReportRepository.findById(claim.getItemId()).ifPresent(item -> {
            item.setCustodyStatus("RETURNED");
            itemReportRepository.save(item);
            if (item.getHubId() != null) {
                collectionHubRepository.findById(item.getHubId()).ifPresent((CollectionHub hub) -> {
                    if (hub.getOccupiedBins() > 0) {
                        hub.setOccupiedBins(hub.getOccupiedBins() - 1);
                        collectionHubRepository.save(hub);
                    }
                });
            }
        });

        Notification notif = Notification.builder()
                .id("ntf-" + UUID.randomUUID().toString().substring(0, 8))
                .recipientUserId(claim.getClaimantUserId())
                .recipientRole("ALL")
                .title("Fixed Collection Handover Completed (" + claim.getItemReferenceCode() + ")")
                .message("\"" + claim.getItemTitle() + "\" has been signed out and collected by " + claim.getClaimantName() + " (" + claim.getClaimantCampusId() + ") at " + claim.getCollectionHubName() + ".")
                .category("CUSTODY_INTAKE")
                .relatedItemId(claim.getItemId())
                .actionCode(claim.getPickupPassCode())
                .isRead(false)
                .createdAt(Instant.now())
                .build();
        notificationRepository.save(notif);

        return ResponseEntity.ok(ownershipClaimRepository.save(claim));
    }
}
