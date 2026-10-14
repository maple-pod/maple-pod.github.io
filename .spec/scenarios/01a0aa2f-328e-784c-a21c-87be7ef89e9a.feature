Feature: Prepare and manage music for offline playback
  @spec:id:01a0aa2f-328e-7030-aaea-fcdc72113cb9
  @spec:demonstrates:01a0aa2f-3a4c-76cf-b151-f585530e9206
  Scenario: 保留穩定歌曲識別碼下的離線音樂
    Given 穩定歌曲 ID X 已有完整離線媒體，且目前曲庫以一個已宣告的本機音訊檔案表示該歌曲
    When 目前曲庫改用另一個已宣告的本機音訊檔案表示相同歌曲，並保留 ID X
    Then 離線媒體仍以 ID X 保留並可供離線播放
    Then 不應因音訊檔案表示改變而要求下載第二份副本
