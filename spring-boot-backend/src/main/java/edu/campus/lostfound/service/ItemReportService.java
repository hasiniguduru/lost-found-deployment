package edu.campus.lostfound.service;

import edu.campus.lostfound.dto.ItemReportRequest;
import edu.campus.lostfound.entity.CollectionHub;
import edu.campus.lostfound.entity.ItemReport;
import edu.campus.lostfound.entity.Notification;
import edu.campus.lostfound.repository.CollectionHubRepository;
import edu.campus.lostfound.repository.ItemReportRepository;
import edu.campus.lostfound.repository.NotificationRepository;
import edu.campus.lostfound.security.CampusUserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemReportService {

    private final ItemReportRepository itemReportRepository;
    private final CollectionHubRepository collectionHubRepository;
    private final NotificationRepository notificationRepository;

    private static final Map<String, String> DEFAULT_IMAGES = Map.of(
            "Electronics", "/images/item_macbook_pro.jpg",
            "Campus ID & Keys", "/images/item_leather_wallet.jpg",
            "Textbooks & Lab Gear", "/images/item_graphing_calc.jpg",
            "Apparel & Bags", "/images/item_insulated_bottle.jpg",
            "Personal Accessories", "/images/item_airpods_case.jpg"
    );

    @Transactional(readOnly = true)
    public List<ItemReport> searchWithFilters(
            String type,
            String category,
            String campusZone,
            String hubId,
            String custodyStatus,
            String search
    ) {
        List<ItemReport> allItems = itemReportRepository.findAllByOrderByCreatedAtDesc();

        return allItems.stream()
                .filter(item -> "ALL".equalsIgnoreCase(type) || item.getType().equalsIgnoreCase(type))
                .filter(item -> "ALL".equalsIgnoreCase(category) || item.getCategory().equalsIgnoreCase(category))
                .filter(item -> "ALL".equalsIgnoreCase(campusZone) || item.getCampusZone().equalsIgnoreCase(campusZone))
                .filter(item -> "ALL".equalsIgnoreCase(hubId) || (item.getHubId() != null && item.getHubId().equalsIgnoreCase(hubId)))
                .filter(item -> "ALL".equalsIgnoreCase(custodyStatus) || item.getCustodyStatus().equalsIgnoreCase(custodyStatus))
                .filter(item -> {
                    if (search == null || search.isBlank()) {
                        return true;
                    }
                    String q = search.trim().toLowerCase(Locale.ROOT);
                    return (item.getTitle() != null && item.getTitle().toLowerCase(Locale.ROOT).contains(q))
                            || (item.getReferenceCode() != null && item.getReferenceCode().toLowerCase(Locale.ROOT).contains(q))
                            || (item.getDescription() != null && item.getDescription().toLowerCase(Locale.ROOT).contains(q))
                            || (item.getSpecificLocation() != null && item.getSpecificLocation().toLowerCase(Locale.ROOT).contains(q))
                            || (item.getCampusZone() != null && item.getCampusZone().toLowerCase(Locale.ROOT).contains(q))
                            || (item.getSubmissionReceiptCode() != null && item.getSubmissionReceiptCode().toLowerCase(Locale.ROOT).contains(q));
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public ItemReport createReport(ItemReportRequest request, CampusUserPrincipal principal) {
        boolean isFound = "FOUND".equalsIgnoreCase(request.getType());
        long count = itemReportRepository.count();
        String referenceCode = "LF-2026-" + (101 + count);

        String submissionReceiptCode = isFound
                ? "SUB-2026-" + ThreadLocalRandom.current().nextInt(1000, 9999)
                : null;

        CollectionHub selectedHub = null;
        if (request.getHubId() != null && !request.getHubId().isBlank()) {
            selectedHub = collectionHubRepository.findById(request.getHubId()).orElse(null);
        }

        String assignedBin = null;
        if (isFound) {
            if (request.getLockerBin() != null && !request.getLockerBin().isBlank()) {
                assignedBin = request.getLockerBin().trim();
            } else {
                int nextBin = selectedHub != null ? selectedHub.getOccupiedBins() + 1 : 1;
                assignedBin = String.format("Bin A-%02d", nextBin);
            }
            if (selectedHub != null) {
                selectedHub.setOccupiedBins(Math.min(selectedHub.getTotalBins(), selectedHub.getOccupiedBins() + 1));
                collectionHubRepository.save(selectedHub);
            }
        }

        String reporterId = principal != null ? principal.getId() : "usr-owner-01";
        String reporterName = principal != null ? principal.getFullName() : "Campus Member";
        String reporterCampusId = principal != null ? principal.getCampusId() : "STU-2026-0001";
        String reporterRole = principal != null ? principal.getRole() : "OWNER";

        String resolvedImage = (request.getImageUrl() != null && !request.getImageUrl().isBlank())
                ? request.getImageUrl().trim()
                : "";

        ItemReport item = ItemReport.builder()
                .id("itm-" + UUID.randomUUID().toString().substring(0, 8))
                .referenceCode(referenceCode)
                .title(request.getTitle().trim())
                .type(request.getType().toUpperCase(Locale.ROOT))
                .category(request.getCategory())
                .campusZone(request.getCampusZone().trim())
                .specificLocation(request.getSpecificLocation().trim())
                .dateOccurred(request.getDateOccurred())
                .description(request.getDescription().trim())
                .distinguishingFeatures(
                        request.getDistinguishingFeatures() != null
                                ? request.getDistinguishingFeatures().trim()
                                : "Standard campus item condition"
                )
                .verificationQuestion(request.getVerificationQuestion().trim())
                .expectedVerificationHint(
                        request.getExpectedVerificationHint() != null
                                ? request.getExpectedVerificationHint().trim()
                                : "Verified during security officer review"
                )
                .custodyStatus(isFound ? "IN_CUSTODY" : "REPORTED")
                .hubId(selectedHub != null ? selectedHub.getId() : request.getHubId())
                .hubName(selectedHub != null ? selectedHub.getName() : null)
                .lockerBin(assignedBin)
                .submissionReceiptCode(submissionReceiptCode)
                .imageUrl(resolvedImage)
                .reportedByUserId(reporterId)
                .reportedByName(reporterName)
                .reportedByCampusId(reporterCampusId)
                .reportedByRole(reporterRole)
                .createdAt(Instant.now())
                .build();

        ItemReport saved = itemReportRepository.save(item);

        String hubDisplayName = selectedHub != null ? selectedHub.getName() : "Campus Collection Desk";
        Notification notif = Notification.builder()
                .id("ntf-" + UUID.randomUUID().toString().substring(0, 8))
                .recipientUserId(reporterId)
                .recipientRole("ALL")
                .title(isFound
                        ? "Found Item Logged & Assigned to " + hubDisplayName
                        : "Lost Item Report " + referenceCode + " Broadcasted")
                .message(isFound
                        ? saved.getTitle() + " (" + referenceCode + ") has been logged for fixed custody at " + hubDisplayName + " (" + assignedBin + "). Submission Receipt: " + submissionReceiptCode + "."
                        : saved.getTitle() + " (" + referenceCode + ") reported lost near " + saved.getCampusZone() + ". Campus Security desks have been alerted.")
                .category(isFound ? "CUSTODY_INTAKE" : "MATCH_ALERT")
                .relatedItemId(saved.getId())
                .actionCode(submissionReceiptCode != null ? submissionReceiptCode : referenceCode)
                .isRead(false)
                .createdAt(Instant.now())
                .build();
        notificationRepository.save(notif);

        return saved;
    }

    @Transactional
    public ItemReport confirmFixedHubCustodyIntake(
            String id,
            String hubId,
            String lockerBin,
            CampusUserPrincipal principal
    ) {
        ItemReport item = itemReportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item report not found: " + id));

        Optional<CollectionHub> hubOpt = (hubId != null && !hubId.isBlank())
                ? collectionHubRepository.findById(hubId)
                : Optional.empty();

        item.setHubId(hubOpt.map(CollectionHub::getId).orElse(hubId));
        item.setHubName(hubOpt.map(CollectionHub::getName).orElse(item.getHubName()));
        item.setLockerBin((lockerBin != null && !lockerBin.isBlank()) ? lockerBin.trim() : "Bin A-10");
        item.setCustodyStatus("IN_CUSTODY");

        if (item.getSubmissionReceiptCode() == null || item.getSubmissionReceiptCode().isBlank()) {
            item.setSubmissionReceiptCode("SUB-2026-" + ThreadLocalRandom.current().nextInt(1000, 9999));
        }

        ItemReport saved = itemReportRepository.save(item);

        Notification notif = Notification.builder()
                .id("ntf-" + UUID.randomUUID().toString().substring(0, 8))
                .recipientUserId(item.getReportedByUserId())
                .recipientRole("ALL")
                .title("Fixed Collection Custody Intake Confirmed (" + item.getReferenceCode() + ")")
                .message("Item \"" + item.getTitle() + "\" is now secured in " + item.getLockerBin() + " at " + (item.getHubName() != null ? item.getHubName() : "Campus Security Desk") + ". Receipt: " + item.getSubmissionReceiptCode() + ".")
                .category("CUSTODY_INTAKE")
                .relatedItemId(item.getId())
                .actionCode(item.getSubmissionReceiptCode())
                .isRead(false)
                .createdAt(Instant.now())
                .build();
        notificationRepository.save(notif);

        return saved;
    }
}
