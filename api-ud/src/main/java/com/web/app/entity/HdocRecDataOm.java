package com.web.app.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class HdocRecDataOm {
    private String ordernumber;
    private String transTs;
    private String salesmarket;
    private String buyerpartyid;
    private String endcustomerpartyid;
    private String dealagreementid;
    private BigDecimal spec;
    private BigDecimal build;
    private String serie;
    private String chnr;
    private BigDecimal delivery;
    private String model;
    private String vin;
    private String customerAdap;
    private String varstr;
    private String symbolStr;
    private String orderstatus;
    private String assemblyOrder;
    private String facLine;
    private String regdate;
    private String pc;
    private String nsvDescr;
    private BigDecimal firmPlan;
    private BigDecimal vstatus;
    private BigDecimal lastCd;
    private String fo;
    private String productionEnd;
    private String buyerpartyid2;
    private String tdiDealerid;
    private String releasefactory;
    private String retailsalesdate;
    private LocalDateTime registerDatetime;
    private String registerUser;
    private String registerProcess;
    private LocalDateTime updateDatetime;
    private String updateUser;
    private String updateProcess;
}
