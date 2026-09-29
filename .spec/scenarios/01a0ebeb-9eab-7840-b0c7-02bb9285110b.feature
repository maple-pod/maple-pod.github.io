Feature: 最近播放紀錄達到五十筆時完整保留
  @spec:id:01a0ebeb-9eab-7bc0-a452-68b051fc0a43
  @spec:demonstrates:01a0ebeb-97c6-704a-95f6-7768ec149286
  Scenario: 最近播放紀錄達到五十筆時完整保留
    Given 最近播放紀錄已有四十九筆有效紀錄，依新到舊排列
    Given 原有最舊的一筆紀錄可辨識
    Given 有一首與目前最新歷史紀錄不同的可播放歌曲
    When 使用者播放該歌曲至播放位置超過三秒
    When 使用者檢視最近播放紀錄
    Then 最近播放紀錄應共有五十筆
    Then 新播放的歌曲應位於最新一筆
    Then 原有四十九筆紀錄及其相對順序應完整保留
    Then 原有最舊的紀錄應仍位於最後一筆
