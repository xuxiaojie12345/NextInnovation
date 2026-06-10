package com.web.app.domain.entity;

import java.time.LocalDateTime;
import java.math.BigDecimal;

/**
 * OM(RP500)受信データ Entity
 */
public class HdocRecDataOm {
    private String ordernumber;
    private String transTs;
    private String salesmarket;
    private String buyername;
    private String buyerpartyname;
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

    public String getOrdernumber() {
        return ordernumber;
    }

    public void setOrdernumber(String ordernumber) {
        this.ordernumber = ordernumber;
    }

    public String getTransTs() {
        return transTs;
    }

    public void setTransTs(String transTs) {
        this.transTs = transTs;
    }

    public String getSalesmarket() {
        return salesmarket;
    }

    public void setSalesmarket(String salesmarket) {
        this.salesmarket = salesmarket;
    }

    public String getBuyername() {
        return buyername;
    }

    public void setBuyername(String buyername) {
        this.buyername = buyername;
    }

    public String getBuyerpartyname() {
        return buyerpartyname;
    }

    public void setBuyerpartyname(String buyerpartyname) {
        this.buyerpartyname = buyerpartyname;
    }

    public String getBuyerpartyid() {
        return buyerpartyid;
    }

    public void setBuyerpartyid(String buyerpartyid) {
        this.buyerpartyid = buyerpartyid;
    }

    public String getEndcustomerpartyid() {
        return endcustomerpartyid;
    }

    public void setEndcustomerpartyid(String endcustomerpartyid) {
        this.endcustomerpartyid = endcustomerpartyid;
    }

    public String getDealagreementid() {
        return dealagreementid;
    }

    public void setDealagreementid(String dealagreementid) {
        this.dealagreementid = dealagreementid;
    }

    public BigDecimal getSpec() {
        return spec;
    }

    public void setSpec(BigDecimal spec) {
        this.spec = spec;
    }

    public BigDecimal getBuild() {
        return build;
    }

    public void setBuild(BigDecimal build) {
        this.build = build;
    }

    public String getSerie() {
        return serie;
    }

    public void setSerie(String serie) {
        this.serie = serie;
    }

    public String getChnr() {
        return chnr;
    }

    public void setChnr(String chnr) {
        this.chnr = chnr;
    }

    public BigDecimal getDelivery() {
        return delivery;
    }

    public void setDelivery(BigDecimal delivery) {
        this.delivery = delivery;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getVin() {
        return vin;
    }

    public void setVin(String vin) {
        this.vin = vin;
    }

    public String getCustomerAdap() {
        return customerAdap;
    }

    public void setCustomerAdap(String customerAdap) {
        this.customerAdap = customerAdap;
    }

    public String getVarstr() {
        return varstr;
    }

    public void setVarstr(String varstr) {
        this.varstr = varstr;
    }

    public String getSymbolStr() {
        return symbolStr;
    }

    public void setSymbolStr(String symbolStr) {
        this.symbolStr = symbolStr;
    }

    public String getOrderstatus() {
        return orderstatus;
    }

    public void setOrderstatus(String orderstatus) {
        this.orderstatus = orderstatus;
    }

    public String getAssemblyOrder() {
        return assemblyOrder;
    }

    public void setAssemblyOrder(String assemblyOrder) {
        this.assemblyOrder = assemblyOrder;
    }

    public String getFacLine() {
        return facLine;
    }

    public void setFacLine(String facLine) {
        this.facLine = facLine;
    }

    public String getRegdate() {
        return regdate;
    }

    public void setRegdate(String regdate) {
        this.regdate = regdate;
    }

    public String getPc() {
        return pc;
    }

    public void setPc(String pc) {
        this.pc = pc;
    }

    public String getNsvDescr() {
        return nsvDescr;
    }

    public void setNsvDescr(String nsvDescr) {
        this.nsvDescr = nsvDescr;
    }

    public BigDecimal getFirmPlan() {
        return firmPlan;
    }

    public void setFirmPlan(BigDecimal firmPlan) {
        this.firmPlan = firmPlan;
    }

    public BigDecimal getVstatus() {
        return vstatus;
    }

    public void setVstatus(BigDecimal vstatus) {
        this.vstatus = vstatus;
    }

    public BigDecimal getLastCd() {
        return lastCd;
    }

    public void setLastCd(BigDecimal lastCd) {
        this.lastCd = lastCd;
    }

    public String getFo() {
        return fo;
    }

    public void setFo(String fo) {
        this.fo = fo;
    }

    public String getProductionEnd() {
        return productionEnd;
    }

    public void setProductionEnd(String productionEnd) {
        this.productionEnd = productionEnd;
    }

    public String getBuyerpartyid2() {
        return buyerpartyid2;
    }

    public void setBuyerpartyid2(String buyerpartyid2) {
        this.buyerpartyid2 = buyerpartyid2;
    }

    public String getTdiDealerid() {
        return tdiDealerid;
    }

    public void setTdiDealerid(String tdiDealerid) {
        this.tdiDealerid = tdiDealerid;
    }

    public String getReleasefactory() {
        return releasefactory;
    }

    public void setReleasefactory(String releasefactory) {
        this.releasefactory = releasefactory;
    }

    public String getRetailsalesdate() {
        return retailsalesdate;
    }

    public void setRetailsalesdate(String retailsalesdate) {
        this.retailsalesdate = retailsalesdate;
    }

    public LocalDateTime getRegisterDatetime() {
        return registerDatetime;
    }

    public void setRegisterDatetime(LocalDateTime registerDatetime) {
        this.registerDatetime = registerDatetime;
    }

    public String getRegisterUser() {
        return registerUser;
    }

    public void setRegisterUser(String registerUser) {
        this.registerUser = registerUser;
    }

    public String getRegisterProcess() {
        return registerProcess;
    }

    public void setRegisterProcess(String registerProcess) {
        this.registerProcess = registerProcess;
    }

    public LocalDateTime getUpdateDatetime() {
        return updateDatetime;
    }

    public void setUpdateDatetime(LocalDateTime updateDatetime) {
        this.updateDatetime = updateDatetime;
    }

    public String getUpdateUser() {
        return updateUser;
    }

    public void setUpdateUser(String updateUser) {
        this.updateUser = updateUser;
    }

    public String getUpdateProcess() {
        return updateProcess;
    }

    public void setUpdateProcess(String updateProcess) {
        this.updateProcess = updateProcess;
    }
}
