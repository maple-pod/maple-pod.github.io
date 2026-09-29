Feature: 跳轉超過三秒後同一次播放只產生一筆歷史紀錄
  @spec:id:01a0ebeb-9dce-71f8-8223-7457c338720e
  @spec:demonstrates:01a0ebeb-96ce-72ec-b2d9-8a7e171a71ec
  Scenario: 跳轉超過三秒後同一次播放只產生一筆歷史紀錄
    Given 最近播放紀錄為空
    Given 歌曲 A 目前可以播放
    When 使用者開始播放 A
    When 使用者在播放位置未達三秒時直接跳轉至超過三秒
    When 使用者檢視最近播放紀錄
    When 使用者在同一次播放中跳回低於三秒的位置
    When 使用者再次跳轉至超過三秒並檢視最近播放紀錄
    Then 第一次檢視時應只顯示一筆歌曲 A
    Then 第二次檢視時仍應只顯示一筆歌曲 A
