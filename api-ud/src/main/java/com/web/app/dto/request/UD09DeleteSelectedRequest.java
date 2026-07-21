package com.web.app.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class UD09DeleteSelectedRequest {
    private List<RecordKey> selectedRecords;

    @Data
    public static class RecordKey {
        private String pc;
        private String num;
        private String market;
    }
}
