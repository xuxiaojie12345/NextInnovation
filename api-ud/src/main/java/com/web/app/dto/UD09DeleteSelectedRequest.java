package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class UD09DeleteSelectedRequest {
    private List<SelectedRecord> selectedRecords;

    @Data
    public static class SelectedRecord {
        private String pc;
        private String num;
        private String market;
    }
}
