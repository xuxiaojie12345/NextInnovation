package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class HdocMarketAuth {
    private String userid;
    private String market;
    private String type;
    private String bu;
    private LocalDateTime registerDatetime;
    private String registerUser;
    private String registerProcess;
    private LocalDateTime updateDatetime;
    private String updateUser;
    private String updateProcess;
}
