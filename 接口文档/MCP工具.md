## MCP工具-编辑


**接口地址**:`/specify/specifysystem/mcpTools/platformMcpTool/edit`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "id": "",
  "displayName": "",
  "description": "",
  "detail": "",
  "category": "",
  "config": "",
  "instanceLevel": 0,
  "visible": 0,
  "status": 0,
  "defaultEnabled": 0,
  "sortOrder": 0,
  "createBy": "",
  "createTime": "",
  "updateBy": "",
  "updateTime": "",
  "delFlag": 0
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|platformMcpTool|MCP工具|body|true|PlatformMcpTool|PlatformMcpTool|
|&emsp;&emsp;id|主键||false|string||
|&emsp;&emsp;displayName|展示名称||false|string||
|&emsp;&emsp;description|一句话描述||false|string||
|&emsp;&emsp;detail|详细说明||false|string||
|&emsp;&emsp;category|工具模板||false|string||
|&emsp;&emsp;config|配置参数值||false|string||
|&emsp;&emsp;instanceLevel|实例化策略||false|integer(int32)||
|&emsp;&emsp;visible|是否在工具列表显示||false|integer(int32)||
|&emsp;&emsp;status|工具状态||false|integer(int32)||
|&emsp;&emsp;defaultEnabled|新App是否默认启用||false|integer(int32)||
|&emsp;&emsp;sortOrder|排序权重||false|integer(int32)||
|&emsp;&emsp;createBy|创建人||false|string||
|&emsp;&emsp;createTime|创建日期||false|string(date-time)||
|&emsp;&emsp;updateBy|更新人||false|string||
|&emsp;&emsp;updateTime|更新日期||false|string(date-time)||
|&emsp;&emsp;delFlag|删除状态||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultString|
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



## MCP工具-添加


**接口地址**:`/specify/specifysystem/mcpTools/platformMcpTool/add`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "id": "",
  "displayName": "",
  "description": "",
  "detail": "",
  "category": "",
  "config": "",
  "instanceLevel": 0,
  "visible": 0,
  "status": 0,
  "defaultEnabled": 0,
  "sortOrder": 0,
  "createBy": "",
  "createTime": "",
  "updateBy": "",
  "updateTime": "",
  "delFlag": 0
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|platformMcpTool|MCP工具|body|true|PlatformMcpTool|PlatformMcpTool|
|&emsp;&emsp;id|主键||false|string||
|&emsp;&emsp;displayName|展示名称||false|string||
|&emsp;&emsp;description|一句话描述||false|string||
|&emsp;&emsp;detail|详细说明||false|string||
|&emsp;&emsp;category|工具模板||false|string||
|&emsp;&emsp;config|配置参数值||false|string||
|&emsp;&emsp;instanceLevel|实例化策略||false|integer(int32)||
|&emsp;&emsp;visible|是否在工具列表显示||false|integer(int32)||
|&emsp;&emsp;status|工具状态||false|integer(int32)||
|&emsp;&emsp;defaultEnabled|新App是否默认启用||false|integer(int32)||
|&emsp;&emsp;sortOrder|排序权重||false|integer(int32)||
|&emsp;&emsp;createBy|创建人||false|string||
|&emsp;&emsp;createTime|创建日期||false|string(date-time)||
|&emsp;&emsp;updateBy|更新人||false|string||
|&emsp;&emsp;updateTime|更新日期||false|string(date-time)||
|&emsp;&emsp;delFlag|删除状态||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultString|
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



## MCP工具-通过id查询


**接口地址**:`/specify/specifysystem/mcpTools/platformMcpTool/queryById`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||query|true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultPlatformMcpTool|
|401|Unauthorized|ResultObject|


**响应状态码-200**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|success|成功标志|boolean||
|message|返回处理消息|string||
|code|返回代码|integer(int32)|integer(int32)|
|result||PlatformMcpTool|PlatformMcpTool|
|&emsp;&emsp;id|主键|string||
|&emsp;&emsp;displayName|展示名称|string||
|&emsp;&emsp;description|一句话描述|string||
|&emsp;&emsp;detail|详细说明|string||
|&emsp;&emsp;category|工具模板|string||
|&emsp;&emsp;config|配置参数值|string||
|&emsp;&emsp;instanceLevel|实例化策略|integer(int32)||
|&emsp;&emsp;visible|是否在工具列表显示|integer(int32)||
|&emsp;&emsp;status|工具状态|integer(int32)||
|&emsp;&emsp;defaultEnabled|新App是否默认启用|integer(int32)||
|&emsp;&emsp;sortOrder|排序权重|integer(int32)||
|&emsp;&emsp;createBy|创建人|string||
|&emsp;&emsp;createTime|创建日期|string(date-time)||
|&emsp;&emsp;updateBy|更新人|string||
|&emsp;&emsp;updateTime|更新日期|string(date-time)||
|&emsp;&emsp;delFlag|删除状态|integer(int32)||
|timestamp|时间戳|integer(int64)|integer(int64)|


**响应示例**:
```javascript
{
	"success": true,
	"message": "",
	"code": 0,
	"result": {
		"id": "",
		"displayName": "",
		"description": "",
		"detail": "",
		"category": "",
		"config": "",
		"instanceLevel": 0,
		"visible": 0,
		"status": 0,
		"defaultEnabled": 0,
		"sortOrder": 0,
		"createBy": "",
		"createTime": "",
		"updateBy": "",
		"updateTime": "",
		"delFlag": 0
	},
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



## MCP工具-分页列表查询


**接口地址**:`/specify/specifysystem/mcpTools/platformMcpTool/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|platformMcpTool|MCP工具|query|true|PlatformMcpTool|PlatformMcpTool|
|&emsp;&emsp;id|主键||false|string||
|&emsp;&emsp;displayName|展示名称||false|string||
|&emsp;&emsp;description|一句话描述||false|string||
|&emsp;&emsp;detail|详细说明||false|string||
|&emsp;&emsp;category|工具模板||false|string||
|&emsp;&emsp;config|配置参数值||false|string||
|&emsp;&emsp;instanceLevel|实例化策略||false|integer(int32)||
|&emsp;&emsp;visible|是否在工具列表显示||false|integer(int32)||
|&emsp;&emsp;status|工具状态||false|integer(int32)||
|&emsp;&emsp;defaultEnabled|新App是否默认启用||false|integer(int32)||
|&emsp;&emsp;sortOrder|排序权重||false|integer(int32)||
|&emsp;&emsp;createBy|创建人||false|string||
|&emsp;&emsp;createTime|创建日期||false|string(date-time)||
|&emsp;&emsp;updateBy|更新人||false|string||
|&emsp;&emsp;updateTime|更新日期||false|string(date-time)||
|&emsp;&emsp;delFlag|删除状态||false|integer(int32)||
|pageNo||query|false|integer(int32)||
|pageSize||query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPagePlatformMcpTool|
|401|Unauthorized|ResultObject|


**响应状态码-200**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|success|成功标志|boolean||
|message|返回处理消息|string||
|code|返回代码|integer(int32)|integer(int32)|
|result||IPagePlatformMcpTool|IPagePlatformMcpTool|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records||array|PlatformMcpTool|
|&emsp;&emsp;&emsp;&emsp;id|主键|string||
|&emsp;&emsp;&emsp;&emsp;displayName|展示名称|string||
|&emsp;&emsp;&emsp;&emsp;description|一句话描述|string||
|&emsp;&emsp;&emsp;&emsp;detail|详细说明|string||
|&emsp;&emsp;&emsp;&emsp;category|工具模板|string||
|&emsp;&emsp;&emsp;&emsp;config|配置参数值|string||
|&emsp;&emsp;&emsp;&emsp;instanceLevel|实例化策略|integer(int32)||
|&emsp;&emsp;&emsp;&emsp;visible|是否在工具列表显示|integer(int32)||
|&emsp;&emsp;&emsp;&emsp;status|工具状态|integer(int32)||
|&emsp;&emsp;&emsp;&emsp;defaultEnabled|新App是否默认启用|integer(int32)||
|&emsp;&emsp;&emsp;&emsp;sortOrder|排序权重|integer(int32)||
|&emsp;&emsp;&emsp;&emsp;createBy|创建人|string||
|&emsp;&emsp;&emsp;&emsp;createTime|创建日期|string(date-time)||
|&emsp;&emsp;&emsp;&emsp;updateBy|更新人|string||
|&emsp;&emsp;&emsp;&emsp;updateTime|更新日期|string(date-time)||
|&emsp;&emsp;&emsp;&emsp;delFlag|删除状态|integer(int32)||
|&emsp;&emsp;total||integer(int64)||
|&emsp;&emsp;pages||integer(int64)||
|timestamp|时间戳|integer(int64)|integer(int64)|


**响应示例**:
```javascript
{
	"success": true,
	"message": "",
	"code": 0,
	"result": {
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": "",
				"displayName": "",
				"description": "",
				"detail": "",
				"category": "",
				"config": "",
				"instanceLevel": 0,
				"visible": 0,
				"status": 0,
				"defaultEnabled": 0,
				"sortOrder": 0,
				"createBy": "",
				"createTime": "",
				"updateBy": "",
				"updateTime": "",
				"delFlag": 0
			}
		],
		"total": 0,
		"pages": 0
	},
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



## MCP工具-通过id删除


**接口地址**:`/specify/specifysystem/mcpTools/platformMcpTool/delete`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||query|true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultString|
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