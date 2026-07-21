package com.web.app.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class UD18CreateUserDocRequest {
    private String userId;
    private List<String> doctypes;
}
