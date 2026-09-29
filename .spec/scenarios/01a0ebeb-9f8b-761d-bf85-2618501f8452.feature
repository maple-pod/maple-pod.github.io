Feature: 從最近播放紀錄重播時切換至全部歌曲清單
  @spec:id:01a0ebeb-9f8b-7b54-8640-6572d8552cd6
  @spec:demonstrates:01a0ebeb-9929-7af2-a85f-7791931f8562
  Scenario: 從最近播放紀錄重播時切換至全部歌曲清單
    Given 最近播放紀錄包含目前可播放的歌曲 A
    Given 使用者處於線上狀態
    Given 使用者正在非 All 的播放清單 P 中播放音樂
    When 使用者開啟最近播放紀錄
    When 使用者選擇歌曲 A 進行重播
    Then 歌曲 A 應開始播放
    Then All 應顯示為目前播放中的清單
    Then 原播放清單 P 不應再顯示為目前播放中的清單
