Feature: Return to recently heard music
  @spec:id:01a0aa2f-2565-7f8d-a868-ea50ab3edafb
  @spec:demonstrates:01a0ebeb-98b3-727f-b6e8-9e5bf473090b
  @spec:demonstrates:01a0ebeb-9929-7af2-a85f-7791931f8562
  Scenario: 暫時無法播放的歷史紀錄仍會保留
    Given 最近播放紀錄包含曲庫中有效的歌曲 A 和 U
    Given 離線時 A 可以播放，但 U 暫時無法播放
    When 使用者檢視最近播放紀錄
    When 使用者嘗試從最近播放紀錄播放 U
    When 使用者重新載入應用程式
    When 使用者再次檢視最近播放紀錄並嘗試播放 U
    Then 首次檢視應依原有順序保留 A 和 U
    Then A 應可播放，U 應顯示為停用且無法播放
    Then 持久化的最近播放紀錄應仍包含 A 和 U
    Then 重新載入後仍應依原有順序顯示 A 和 U，且 A 可播放、U 為停用狀態
    Then 重新載入後仍不得播放 U
