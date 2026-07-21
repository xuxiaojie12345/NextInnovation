package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class HdocRecDataVdaVariants {
    private String serie;
    private String chnr;
    private String vin;
    private String familyId;
    private String variantId;
    private String transTs;
    private LocalDateTime registerDatetime;
    private String registerUser;
    private String registerProcess;
    private LocalDateTime updateDatetime;
    private String updateUser;
    private String updateProcess;
}
