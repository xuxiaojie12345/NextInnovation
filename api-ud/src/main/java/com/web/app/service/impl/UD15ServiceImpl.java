package com.web.app.service.impl;

import com.web.app.mapper.UD15Mapper;
import com.web.app.service.UD15Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.w3c.dom.*;
import javax.xml.parsers.*;
import java.io.*;
import java.util.*;

/**
 * UD15SelecthdocsenddatavinplateApi 服务实现类
 */
@Service
public class UD15ServiceImpl implements UD15Service {

    @Autowired
    private UD15Mapper ud15Mapper;

    @Override
    public Map<String, Object> processVinPlate(String serie, String chnr, String operation, String updateUser) {
        switch (operation) {
            case "viewInfo":
                return handleViewInfo(serie, chnr);
            case "setRegenerate":
                return handleSetRegenerate(serie, chnr, updateUser);
            case "setOK":
                return handleSetOK(serie, chnr, updateUser);
            case "changeToBasicInfo":
                return handleChangeToBasicInfo(serie, chnr, updateUser);
            case "changeToAdvancedInfo":
                return handleChangeToAdvancedInfo(serie, chnr, updateUser);
            default:
                throw new IllegalArgumentException("Unknown operation: " + operation);
        }
    }

    private Map<String, Object> handleViewInfo(String serie, String chnr) {
        Map<String, Object> info = ud15Mapper.selectVinPlateInfo(serie, chnr);
        if (info == null) {
            throw new IllegalArgumentException("Chassis number " + serie + "-" + chnr + " not found.");
        }
        // 映射字段名为前端期望的格式（对应详细设计 2.1 控件属性表）
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("chassisNumber", serie + "-" + chnr);
        result.put("plateType", info.getOrDefault("TYPE", ""));
        result.put("status", info.getOrDefault("STATUS", ""));
        result.put("errorMessage", info.getOrDefault("MSG", ""));
        // def只保留日期部分（T之前）
        String regDatetime = (String) info.getOrDefault("REGISTER_DATETIME", "");
        if (regDatetime != null && regDatetime.contains("T")) {
            regDatetime = regDatetime.substring(0, regDatetime.indexOf('T'));
        }
        result.put("def", regDatetime);
        result.put("dataReady", info.getOrDefault("DOC_READY", ""));
        result.put("sentToCabFactory", info.getOrDefault("DOC_SENT", ""));
        // XML_DOC中存储XML，Print items提取PrintItemName，VP Data提取Variant名与Value
        String xmlDoc = (String) info.getOrDefault("XML_DOC", "");
        result.put("printItems", parsePrintItems(xmlDoc));
        result.put("vpData", parseVpData(xmlDoc));
        return result;
    }

    private Map<String, Object> handleSetRegenerate(String serie, String chnr, String updateUser) {
        int rows = ud15Mapper.updateStatus(serie, chnr, "0", updateUser);
        if (rows == 0) {
            throw new IllegalArgumentException("Chassis number " + serie + "-" + chnr + " not found.");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Status updated successfully.");
        return result;
    }

    private Map<String, Object> handleSetOK(String serie, String chnr, String updateUser) {
        int rows = ud15Mapper.updateStatus(serie, chnr, "1", updateUser);
        if (rows == 0) {
            throw new IllegalArgumentException("Chassis number " + serie + "-" + chnr + " not found.");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Status updated successfully.");
        return result;
    }

    private Map<String, Object> handleChangeToBasicInfo(String serie, String chnr, String updateUser) {
        int rows = ud15Mapper.updateStatusAndType(serie, chnr, "0", "1", updateUser);
        if (rows == 0) {
            throw new IllegalArgumentException("Chassis number " + serie + "-" + chnr + " not found.");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Status and Type updated successfully.");
        return result;
    }

    private Map<String, Object> handleChangeToAdvancedInfo(String serie, String chnr, String updateUser) {
        int rows = ud15Mapper.updateStatusAndType(serie, chnr, "0", "2", updateUser);
        if (rows == 0) {
            throw new IllegalArgumentException("Chassis number " + serie + "-" + chnr + " not found.");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Status and Type updated successfully.");
        return result;
    }

    /**
     * 从XML_DOC中提取PrintItemName值
     */
    private String parsePrintItems(String xmlDoc) {
        if (xmlDoc == null || xmlDoc.trim().isEmpty()) return "";
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new ByteArrayInputStream(xmlDoc.getBytes("UTF-8")));
            NodeList printItemList = doc.getElementsByTagName("PrintItemName");
            List<String> items = new ArrayList<>();
            for (int i = 0; i < printItemList.getLength(); i++) {
                String text = printItemList.item(i).getTextContent();
                if (text != null && !text.trim().isEmpty()) {
                    items.add(text.trim());
                }
            }
            return String.join(", ", items);
        } catch (Exception e) {
            return xmlDoc;
        }
    }

    /**
     * 从XML_DOC中提取Variant名与Value
     */
    private String parseVpData(String xmlDoc) {
        if (xmlDoc == null || xmlDoc.trim().isEmpty()) return "";
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new ByteArrayInputStream(xmlDoc.getBytes("UTF-8")));
            NodeList variantList = doc.getElementsByTagName("Variant");
            List<String> items = new ArrayList<>();
            for (int i = 0; i < variantList.getLength(); i++) {
                Node variant = variantList.item(i);
                String name = "";
                String value = "";
                if (variant.getNodeType() == Node.ELEMENT_NODE) {
                    Element elem = (Element) variant;
                    NodeList nameNodes = elem.getElementsByTagName("Name");
                    if (nameNodes.getLength() > 0) name = nameNodes.item(0).getTextContent();
                    NodeList valueNodes = elem.getElementsByTagName("Value");
                    if (valueNodes.getLength() > 0) value = valueNodes.item(0).getTextContent();
                }
                items.add((name != null ? name.trim() : "") + "=" + (value != null ? value.trim() : ""));
            }
            return String.join(", ", items);
        } catch (Exception e) {
            return xmlDoc;
        }
    }
}
