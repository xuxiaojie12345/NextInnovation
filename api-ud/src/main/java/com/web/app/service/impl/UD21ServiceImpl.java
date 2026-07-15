package com.web.app.service.impl;

import com.web.app.mapper.UD21Mapper;
import com.web.app.service.UD21Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
/**

 * UD21ServiceImpl

 */

public class UD21ServiceImpl implements UD21Service {

    @Autowired
    /** ud21Mapper */

    private UD21Mapper ud21Mapper;

    @Override
    /**

     * getMarket

     */

    public List<Map<String, String>> getMarket() {
        return ud21Mapper.selectMarket();
    }
}
