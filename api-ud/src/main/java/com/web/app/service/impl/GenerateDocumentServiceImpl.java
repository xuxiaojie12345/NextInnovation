package com.web.app.service.impl;

import com.web.app.dto.response.DocumentDataResponse;
import com.web.app.dto.response.VehicleSpecificationResponse;
import com.web.app.entity.*;
import com.web.app.mapper.*;
import com.web.app.service.GenerateDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GenerateDocumentServiceImpl implements GenerateDocumentService {

    /** S-Note 提示语（固定文案） */
    private static final String SNOTE_MESSAGE = "The S-Notes above can affect homologation documents.";
    /** Master Market 固定值 */
    private static final String MASTER_MARKET = "-EU";
    /** Modify 链接文案 */
    private static final String MODIFY_LINK_TEXT = "Modify Document";
    /** 使用模板（实际由模板规则选择，此处按 docType 固定） */
    private static final String USING_TEMPLATE = "VIN_PLATE_template_v2.trf";
    /** HDoc 版本 */
    private static final String HDOC_VERSION = "2.1.0";
    /** 文件下载前缀 */
    private static final String FILE_DOWNLOAD_PREFIX = "/api/download/vinplate/";

    @Autowired
    private HdocRecDataOmMapper hdocRecDataOmMapper;
    @Autowired
    private HdocRecDataVdaGeneralMapper hdocRecDataVdaGeneralMapper;
    @Autowired
    private HdocRecDataVdaVariantsMapper hdocRecDataVdaVariantsMapper;
    @Autowired
    private HdocRecDataKapSnoteMapper hdocRecDataKapSnoteMapper;
    @Autowired
    private HdocRecDataKolaTireMasterMapper hdocRecDataKolaTireMasterMapper;
    @Autowired
    private HdocAdcaChangeMapper hdocAdcaChangeMapper;
    @Autowired
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;
    @Autowired
    private HdocSendDataVinPlateMapper hdocSendDataVinPlateMapper;

    @Override
    public DocumentDataResponse generateDocument(String chassisNo, String docType) {
        DocumentDataResponse resp = new DocumentDataResponse();

        // 1) 从 OM 表按 VIN 取得订单信息（含 SERIE/CHNR/ORDERNUMBER，用于后续关联）
        List<HdocRecDataOm> omList = hdocRecDataOmMapper.selectByChassisNo(chassisNo);
        HdocRecDataOm om = omList.isEmpty() ? null : omList.get(0);

        // 2) VDA_GENERAL：制造周 / 主规格周 / 市场
        List<HdocRecDataVdaGeneral> vdaList = hdocRecDataVdaGeneralMapper.selectByChassisNo(chassisNo);
        HdocRecDataVdaGeneral vda = vdaList.isEmpty() ? null : vdaList.get(0);

        // 3) S-Note 列表
        List<HdocRecDataKapSnote> sNoteList = hdocRecDataKapSnoteMapper.selectByChassisNo(chassisNo);

        // 4) 轮胎主数据（Load Index）
        List<HdocRecDataKolaTireMaster> tireList = hdocRecDataKolaTireMasterMapper.selectByChassisNo(chassisNo);

        // ---- AD-Change 相关（通过 OM 的 SERIE+CHNR 关联） ----
        String serie = om != null ? om.getSerie() : null;
        String chnr = om != null ? om.getChnr() : null;

        boolean adChangeActive = false;
        if (serie != null && chnr != null) {
            HdocAdcaChange adcaChange = hdocAdcaChangeMapper.selectBySerieAndChnr(serie, chnr);
            adChangeActive = adcaChange != null && "Y".equalsIgnoreCase(adcaChange.getAct());
        }

        List<DocumentDataResponse.ReplacingParameter> replacingParams = new ArrayList<>();
        if (serie != null && chnr != null) {
            List<HdocAdcaModification> modifications =
                    hdocAdcaModificationMapper.selectBySerieAndChassisNo(serie, chnr);
            for (HdocAdcaModification m : modifications) {
                replacingParams.add(new DocumentDataResponse.ReplacingParameter(
                        m.getVariable(), m.getNewval()));
            }
        }

        // ---- 生成文件 URL（通过 OM 的 ORDERNUMBER 关联 HDOC_SEND_DATA_VIN_PLATE） ----
        String generatedFileUrl = null;
        if (om != null && om.getOrdernumber() != null) {
            HdocSendDataVinPlate sendData =
                    hdocSendDataVinPlateMapper.selectByOrderNumber(om.getOrdernumber());
            if (sendData != null && sendData.getFilenameOnDisk() != null) {
                generatedFileUrl = FILE_DOWNLOAD_PREFIX + sendData.getFilenameOnDisk();
            }
        }

        // ---- 组装 ----
        resp.setChassisInfo(chassisNo);
        resp.setOrdernumber(om != null ? om.getOrdernumber() : null);
        resp.setBuildWeek(vda != null ? vda.getBuildWeek() : null);
        resp.setSpecWeek(vda != null ? vda.getMainSpecWeek() : null);
        resp.setMarket(vda != null ? vda.getCountryOfOperation() : null);
        resp.setMasterMarket(MASTER_MARKET);

        // S-Note：多条以分号分隔（前端 parseSNoteList 支持 [,;] 分隔）
        String sNoteNo = sNoteList.stream()
                .map(HdocRecDataKapSnote::getSnote)
                .filter(n -> n != null && !n.trim().isEmpty())
                .collect(Collectors.joining(";"));
        resp.setSNoteNo(sNoteNo);
        resp.setSNoteMessage(SNOTE_MESSAGE);

        // Load Index：Tire Master 的 LOAD_INDEX，多条以逗号分隔
        String loadIndex = tireList.stream()
                .map(HdocRecDataKolaTireMaster::getLoadIndex)
                .filter(n -> n != null && !n.trim().isEmpty())
                .collect(Collectors.joining(","));
        resp.setLoadIndex(loadIndex);

        resp.setAdChangeActive(adChangeActive);
        resp.setModifyLinkText(MODIFY_LINK_TEXT);
        resp.setUsingTemplate(USING_TEMPLATE);
        resp.setReplacingParameters(replacingParams);
        resp.setGeneratedFileUrl(generatedFileUrl);

        resp.setServerDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        resp.setHDocVersion(HDOC_VERSION);

        return resp;
    }

    @Override
    public VehicleSpecificationResponse getVehicleSpecification(String chassisNo) {
        // Aggregate data from multiple tables into a single response
        VehicleSpecificationResponse resp = new VehicleSpecificationResponse();
        resp.setChassisNo(chassisNo);
        // For now, return what we can query
        return resp;
    }
}
