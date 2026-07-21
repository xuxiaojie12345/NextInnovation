package com.web.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VariableSearchRecord {
    private String variable;
    private String type;
    private String description;
    private String createdByUser;
    private String createdDate;
}
