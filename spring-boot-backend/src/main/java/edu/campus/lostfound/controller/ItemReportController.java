package edu.campus.lostfound.controller;

import edu.campus.lostfound.dto.ItemReportRequest;
import edu.campus.lostfound.security.CampusUserPrincipal;
import edu.campus.lostfound.service.ItemReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/items")
@RequiredArgsConstructor
public class ItemReportController {

    private final ItemReportService itemReportService;

    @GetMapping
    public ResponseEntity<?> listItems(
            @RequestParam(required = false, defaultValue = "ALL") String type,
            @RequestParam(required = false, defaultValue = "ALL") String category,
            @RequestParam(required = false, defaultValue = "ALL") String campusZone,
            @RequestParam(required = false, defaultValue = "ALL") String hubId,
            @RequestParam(required = false, defaultValue = "ALL") String custodyStatus,
            @RequestParam(required = false, defaultValue = "") String search
    ) {
        return ResponseEntity.ok(
            itemReportService.searchWithFilters(type, category, campusZone, hubId, custodyStatus, search)
        );
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'FINDER', 'ADMIN_SECURITY')")
    public ResponseEntity<?> createItemReport(
            @Valid @RequestBody ItemReportRequest request,
            @AuthenticationPrincipal CampusUserPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(itemReportService.createReport(request, principal));
    }

    @PatchMapping("/{id}/custody-intake")
    @PreAuthorize("hasAnyRole('FINDER', 'ADMIN_SECURITY')")
    public ResponseEntity<?> confirmFixedHubSubmission(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal CampusUserPrincipal principal
    ) {
        return ResponseEntity.ok(
            itemReportService.confirmFixedHubCustodyIntake(id, payload.get("hubId"), payload.get("lockerBin"), principal)
        );
    }
}
