package com.web.app.dto;

import lombok.Data;

@Data
public class UD19SearchRequest {
    private String userid;
    private String user;
    private String market;
    private boolean notSet;
    private boolean rule;
    private boolean template;
}
