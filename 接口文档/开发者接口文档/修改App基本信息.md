

## 修改 App 基本信息


**接口地址**:`/specify/specifyuser/app/{appId}`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>修改 App 的名称和/或描述。至少需要提供一个字段。
如果修改名称，会校验当前用户下名称是否重复（排除自身）。</p>
<p>请求体 JSON 字段：</p>
<ul>
<li><code>name</code> (String, 可选): 新名称</li>
<li><code>description</code> (String, 可选): 新描述</li>
</ul>



**请求示例**:


```javascript
{
  "name": "",
  "description": ""
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|appId|App ID|path|true|string||
|updateAppRequest|修改 App 基本信息请求|body|true|UpdateAppRequest|UpdateAppRequest|
|&emsp;&emsp;name|新名称||false|string||
|&emsp;&emsp;description|新描述||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|业务错误（HTTP 200，Result.code）：appId 格式错误/超长 → 400；App 不存在 → 404；无权限 → 403；至少提供一个字段/名称不能为空 → 400；名称已存在 → 409|ResultString|
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