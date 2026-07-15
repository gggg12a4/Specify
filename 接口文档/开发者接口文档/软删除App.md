

## 软删除 App


**接口地址**:`/specify/specifyuser/app/{appId}`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>软删除指定 App（设置 del_flag=1）。会级联软删除：</p>
<ul>
<li>该 App 下的所有 app_versions 记录</li>
<li>该 App 关联的所有 app_templates 模板记录（如有）</li>
</ul>
<p>注意：仅 App 创建者可以删除自己的 App。</p>



**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|appId|App ID|path|true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|业务错误（HTTP 200，Result.code）：appId 格式错误/超长 → 400；App 不存在 → 404；无权限 → 403；删除失败（并发冲突）→ 409|ResultString|
|401|Unauthorized|ResultObject|


**响应状态码-200**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|success|成功标志|boolean||
|message|返回处理消息|string||
|code|返回代码|integer(int32)|integer(int32)|
|result|返回数据对象|string||
|timestamp|时间戳|integer(int64)|integer(int64)|


**响应示例**:
```javascript
{
	"success": true,
	"message": "",
	"code": 0,
	"result": "",
	"timestamp": 0
}
```


**响应状态码-401**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|success|成功标志|boolean||
|message|返回处理消息|string||
|code|返回代码|integer(int32)|integer(int32)|
|result|返回数据对象|object||
|timestamp|时间戳|integer(int64)|integer(int64)|


**响应示例**:
```javascript
{
	"success": true,
	"message": "",
	"code": 0,
	"result": {},
	"timestamp": 0
}
```