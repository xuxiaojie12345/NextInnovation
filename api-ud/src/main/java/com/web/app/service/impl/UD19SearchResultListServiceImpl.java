package com.web.app.service.impl;

import com.web.app.service.UD19SearchResultListService;
import com.web.app.dto.*;
import com.web.app.mapper.*;
import com.web.app.entity.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class UD19SearchResultListServiceImpl implements UD19SearchResultListService {

    @Autowired
    private HdocUserInforMapper hdocUserInforMapper;
    @Autowired
    private HdocMarketAuthMapper hdocMarketAuthMapper;

    @Override
    public UD19SearchResponse searchHdoc(UD19SearchRequest request) {
        List<UD19SearchResponse.UserInfo> users = new ArrayList<>();

        if (request.getUserid() != null && !request.getUserid().isEmpty()) {
            HdocUserInfor user = hdocUserInforMapper.findByUserId(request.getUserid());
            if (user != null) {
                List<HdocMarketAuth> markets = hdocMarketAuthMapper.selectByUserid(request.getUserid());
                List<String> marketList = new ArrayList<>();
                for (HdocMarketAuth m : markets) {
                    marketList.add(m.getMarket());
                }
                UD19SearchResponse.UserInfo info = new UD19SearchResponse.UserInfo();
                info.setUserid(user.getUserid());
                info.setUsername(user.getUsername());
                info.setMarkets(marketList);
                users.add(info);
            }
        }

        return UD19SearchResponse.success(users, users.size());
    }
}
