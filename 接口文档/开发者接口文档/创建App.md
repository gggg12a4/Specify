

## 创建 App


**接口地址**:`/specify/specifyuser/app/create`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>创建一个新的 AI Agent App，支持两种创建方式（互斥，必须二选一）：</p>
<p>从模板创建（提供 template_app_id）：</p>
<ul>
<li>从指定模板复制 modelGroupId、systemPrompt、selectedModel、toolSnapshot 到草稿</li>
</ul>
<p>从零创建（提供 model_group_id）：</p>
<ul>
<li>在指定模型分组下创建空白 App</li>
<li>会检查当前用户下 App 名称是否重复</li>
</ul>
<p>请求体 JSON 字段：</p>
<ul>
<li><code>name</code> (String, 必填): App 名称</li>
<li><code>description</code> (String, 可选): App 描述</li>
<li><code>template_app_id</code> (String): 模板 App ID（与 model_group_id 二选一）</li>
<li><code>model_group_id</code> (String): 模型分组 ID（与 template_app_id 二选一）</li>
</ul>
<p>返回值：<code>{ &quot;appId&quot;: &quot;...&quot; }</code></p>



**请求示例**:


```javascript
{
  "name": "",
  "description": "",
  "template_app_id": "",
  "model_group_id": ""
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|createAppRequest|创建 App 请求|body|true|CreateAppRequest|CreateAppRequest|
|&emsp;&emsp;name|App 名称||true|string||
|&emsp;&emsp;description|App 描述||false|string||
|&emsp;&emsp;template_app_id|模板 App ID（与 model_group_id 二选一）||false|string||
|&emsp;&emsp;model_group_id|模型分组 ID（与 template_app_id 二选一）||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|业务错误：名称已存在 / 模板不存在 / 模型分组不存在 / 参数互斥校验失败|ResultMapStringString|
|401|Unauthorized|ResultObject|


**响应状态码-200**:


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