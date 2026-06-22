package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class HdocRecDataKapSnote {
    private String snote;
    private String variantId;
    private String transTs;
    private LocalDateTime registerDatetime;
    private String registerUser;
    private String registerProcess;
    private LocalDateTime updateDatetime;
    private String updateUser;
    private String updateProcess;
}
