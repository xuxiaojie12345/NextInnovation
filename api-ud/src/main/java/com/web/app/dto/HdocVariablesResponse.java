package com.web.app.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class HdocVariablesResponse {
    private String variable;
    private String type;
    private String description;
    private String registerUser;
    private LocalDateTime registerDatetime;
}
