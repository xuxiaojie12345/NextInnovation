package com.web.app.entity;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HdocRecDataOm {
    private String ordernumber;
    private String transTs;
    private String salesmarket;
    private String buyerpartyid;
    private String endcustomerpartyid;
    private String dealagreementid;
    private Long spec;
    private Long build;
    private String serie;
    private String chnr;
    private Long delivery;
    private String model;
    private String vin;
    private String customerAdapt;
    private String varstr;
    private String symbolStr;
    private String orderstatus;
    private String assemblyOrder;
    private String facLine;
    private String regdate;
    private String pc;
    private String nsvDescr;
    private Long firmPlan;
    private Long vstatus;
    private Long lastCd;
    private String fo;
    private String productionEnd;
    private String buyerpartyid2;
    private String tdiDealerid;
    private String releasefactory;
    private String retailsalesdate;
    private Date registerDatetime;
    private String registerUser;
    private String registerProcess;
    private Date updateDatetime;
    private String updateUser;
    private String updateProcess;
}
