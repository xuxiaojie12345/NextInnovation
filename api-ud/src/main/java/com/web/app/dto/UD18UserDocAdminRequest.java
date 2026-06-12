package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class UD18UserDocAdminRequest {
    private String userid;
    private List<String> documents;
}
