package edu.campus.lostfound.controller;

import edu.campus.lostfound.entity.CollectionHub;
import edu.campus.lostfound.entity.ItemReport;
import edu.campus.lostfound.entity.OwnershipClaim;
import edu.campus.lostfound.repository.CollectionHubRepository;
import edu.campus.lostfound.repository.ItemReportRepository;
import edu.campus.lostfound.repository.NotificationRepository;
import edu.campus.lostfound.repository.OwnershipClaimRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CampusPortalController {

    private final ItemReportRepository itemReportRepository;
    private final OwnershipClaimRepository ownershipClaimRepository;
    private final CollectionHubRepository collectionHubRepository;
    private final NotificationRepository notificationRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardSummary() {
        List<ItemReport> allItems = itemReportRepository.findAllByOrderByCreatedAtDesc();
        List<OwnershipClaim> allClaims = ownershipClaimRepository.findAllByOrderByCreatedAtDesc();

        long totalReports = allItems.size();
        long lostCount = allItems.stream().filter(i -> "LOST".equalsIgnoreCase(i.getType())).count();
        long foundCount = allItems.stream().filter(i -> "FOUND".equalsIgnoreCase(i.getType())).count();
        long inCustodyCount = allItems.stream()
                .filter(i -> "IN_CUSTODY".equalsIgnoreCase(i.getCustodyStatus())
                        || "CLAIM_APPROVED".equalsIgnoreCase(i.getCustodyStatus()))
                .count();
        long returnedCount = allItems.stream()
                .filter(i -> "RETURNED".equalsIgnoreCase(i.getCustodyStatus()))
                .count();
        long pendingClaimsCount = allClaims.stream()
                .filter(c -> "PENDING_VERIFICATION".equalsIgnoreCase(c.getStatus()))
                .count();
        long approvedPickupsCount = allClaims.stream()
                .filter(c -> "APPROVED".equalsIgnoreCase(c.getStatus()))
                .count();

        return ResponseEntity.ok(Map.of(
                "metrics", Map.of(
                        "totalReports", totalReports,
                        "lostCount", lostCount,
                        "foundCount", foundCount,
                        "inCustodyCount", inCustodyCount,
                        "returnedCount", returnedCount,
                        "pendingClaimsCount", pendingClaimsCount,
                        "approvedPickupsCount", approvedPickupsCount
                ),
                "recentItems", allItems.stream().limit(5).collect(Collectors.toList()),
                "pendingClaims", allClaims.stream()
                        .filter(c -> "PENDING_VERIFICATION".equalsIgnoreCase(c.getStatus())
                                || "APPROVED".equalsIgnoreCase(c.getStatus()))
                        .collect(Collectors.toList()),
                "hubs", collectionHubRepository.findAll()
        ));
    }

    @GetMapping("/hubs")
    public ResponseEntity<?> listHubs() {
        List<CollectionHub> hubs = collectionHubRepository.findAll();
        List<ItemReport> allItems = itemReportRepository.findAllByOrderByCreatedAtDesc();

        List<Map<String, Object>> enriched = hubs.stream().map(hub -> {
            List<ItemReport> custodyItems = allItems.stream()
                    .filter(item -> hub.getId().equalsIgnoreCase(item.getHubId())
                            && ("IN_CUSTODY".equalsIgnoreCase(item.getCustodyStatus())
                            || "CLAIM_APPROVED".equalsIgnoreCase(item.getCustodyStatus())))
                    .collect(Collectors.toList());

            Map<String, Object> map = new HashMap<>();
            map.put("id", hub.getId());
            map.put("code", hub.getCode());
            map.put("name", hub.getName());
            map.put("building", hub.getBuilding());
            map.put("roomLocation", hub.getRoomLocation());
            map.put("operatingHours", hub.getOperatingHours());
            map.put("dutyOfficer", hub.getDutyOfficer());
            map.put("contactExt", hub.getContactExt());
            map.put("totalBins", hub.getTotalBins());
            map.put("occupiedBins", hub.getOccupiedBins());
            map.put("custodyItems", custodyItems);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(enriched);
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> listNotifications() {
        return ResponseEntity.ok(notificationRepository.findAllByOrderByCreatedAtDesc());
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable String id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/notifications/read-all")
    public ResponseEntity<?> markAllRead() {
        var all = notificationRepository.findAll();
        all.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(all);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
