package com.web.app.service.impl;

import com.web.app.mapper.UD20Mapper;
import com.web.app.service.UD20Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
/**

 * UD20ServiceImpl

 */

public class UD20ServiceImpl implements UD20Service {

    @Autowired
    /** ud20Mapper */

    private UD20Mapper ud20Mapper;

    @Override
    /**

     * getDocumentList

     */

    public List<Map<String, Object>> getDocumentList(String documentType, String documentTypeOp, String user, String userOp, String date, String dateOp) {
        return ud20Mapper.selectHdocDocumentList(documentType, documentTypeOp, user, userOp, date, dateOp);
    }
}
