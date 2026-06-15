$body = @(
    @{productClass="02"; number=13; market="CHN"}
) | ConvertTo-Json

$result = Invoke-WebRequest -Uri "http://localhost:8081/api/ud09DeleteHdocuserdefinedrules/deleteSelected" -Method POST -ContentType "application/json" -Body $body
Write-Output $result.Content
