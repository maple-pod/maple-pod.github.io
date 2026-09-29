Feature: 正常播放超過三秒後才記錄最近播放紀錄
  @spec:id:01a0ebeb-9d5d-78fa-a852-707a841dfe0c
  @spec:demonstrates:01a0ebeb-96ce-72ec-b2d9-8a7e171a71ec
  Scenario: 正常播放超過三秒後才記錄最近播放紀錄
    Given 最近播放紀錄為空
    Given 歌曲 A 目前可以播放
    When 使用者開始正常播放 A
    When 使用者在播放位置明確小於三秒時檢視最近播放紀錄
    When 使用者繼續正常播放 A 至播放位置超過三秒
    When 使用者再次檢視最近播放紀錄
    Then 首次檢視時最近播放紀錄應為空
    Then 第二次檢視時應只顯示一筆歌曲 A
