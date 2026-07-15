

## Agent工具-编辑


**接口地址**:`/specify/specifysystem/agentTools/platformAgentTool/edit`


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
  "fileAccess": "",
  "modelGroups": "",
  "visible": 0,
  "status": 0,
  "defaultEnabled": 0,
  "allowSubAgentUse": 0,
  "sortOrder": 0,
  "createBy": "",
  "createTime": "",
  "updateBy": "",
  "updateTime": "",
  "delFlag": 0,
  "platformAgentSubtoolList": [
    {
      "id": "",
      "agentToolId": "",
      "refType": "",
      "refId": "",
      "enabled": 0,
      "config": "",
      "createBy": "",
      "createTime": "",
      "updateBy": "",
      "updateTime": "",
      "delFlag": 0
    }
  ]
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|platformAgentToolPage|PlatformAgentToolPage|body|true|PlatformAgentToolPage|PlatformAgentToolPage|
|&emsp;&emsp;id|主键||false|string||
|&emsp;&emsp;displayName|展示名称||false|string||
|&emsp;&emsp;description|一句话描述||false|string||
|&emsp;&emsp;detail|详细说明||false|string||
|&emsp;&emsp;category|工具模板||false|string||
|&emsp;&emsp;config|配置参数值||false|string||
|&emsp;&emsp;instanceLevel|实例化策略||false|integer(int32)||
|&emsp;&emsp;fileAccess|文件访问模式||false|string||
|&emsp;&emsp;modelGroups|支持的模型分组||false|string||
|&emsp;&emsp;visible|是否在工具列表显示||false|integer(int32)||
|&emsp;&emsp;status|工具状态||false|integer(int32)||
|&emsp;&emsp;defaultEnabled|新App是否默认启用||false|integer(int32)||
|&emsp;&emsp;allowSubAgentUse|是否允许被子Agent使用||false|integer(int32)||
|&emsp;&emsp;sortOrder|排序权重||false|integer(int32)||
|&emsp;&emsp;createBy|创建人||false|string||
|&emsp;&emsp;createTime|创建日期||false|string(date-time)||
|&emsp;&emsp;updateBy|更新人||false|string||
|&emsp;&emsp;updateTime|更新日期||false|string(date-time)||
|&emsp;&emsp;delFlag|删除状态||false|integer(int32)||
|&emsp;&emsp;platformAgentSubtoolList|||false|array|PlatformAgentSubtool|
|&emsp;&emsp;&emsp;&emsp;id|主键||false|string||
|&emsp;&emsp;&emsp;&emsp;agentToolId|所属Agent工具ID||false|string||
|&emsp;&emsp;&emsp;&emsp;refType|子工具来源表名||false|string||
|&emsp;&emsp;&emsp;&emsp;refId|子工具ID||false|string||
|&emsp;&emsp;&emsp;&emsp;enabled|是否启用||false|integer(int32)||
|&emsp;&emsp;&emsp;&emsp;config|参数覆盖值||false|string||
|&emsp;&emsp;&emsp;&emsp;createBy|创建人||false|string||
|&emsp;&emsp;&emsp;&emsp;createTime|创建日期||false|string(date-time)||
|&emsp;&emsp;&emsp;&emsp;updateBy|更新人||false|string||
|&emsp;&emsp;&emsp;&emsp;updateTime|更新日期||false|string(date-time)||
|&emsp;&emsp;&emsp;&emsp;delFlag|删除状态||false|integer(int32)||


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



## Agent工具-添加


**接口地址**:`/specify/specifysystem/agentTools/platformAgentTool/add`


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
  "fileAccess": "",
  "modelGroups": "",
  "visible": 0,
  "status": 0,
  "defaultEnabled": 0,
  "allowSubAgentUse": 0,
  "sortOrder": 0,
  "createBy": "",
  "createTime": "",
  "updateBy": "",
  "updateTime": "",
  "delFlag": 0,
  "platformAgentSubtoolList": [
    {
      "id": "",
      "agentToolId": "",
      "refType": "",
      "refId": "",
      "enabled": 0,
      "config": "",
      "createBy": "",
      "createTime": "",
      "updateBy": "",
      "updateTime": "",
      "delFlag": 0
    }
  ]
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|platformAgentToolPage|PlatformAgentToolPage|body|true|PlatformAgentToolPage|PlatformAgentToolPage|
|&emsp;&emsp;id|主键||false|string||
|&emsp;&emsp;displayName|展示名称||false|string||
|&emsp;&emsp;description|一句话描述||false|string||
|&emsp;&emsp;detail|详细说明||false|string||
|&emsp;&emsp;category|工具模板||false|string||
|&emsp;&emsp;config|配置参数值||false|string||
|&emsp;&emsp;instanceLevel|实例化策略||false|integer(int32)||
|&emsp;&emsp;fileAccess|文件访问模式||false|string||
|&emsp;&emsp;modelGroups|支持的模型分组||false|string||
|&emsp;&emsp;visible|是否在工具列表显示||false|integer(int32)||
|&emsp;&emsp;status|工具状态||false|integer(int32)||
|&emsp;&emsp;defaultEnabled|新App是否默认启用||false|integer(int32)||
|&emsp;&emsp;allowSubAgentUse|是否允许被子Agent使用||false|integer(int32)||
|&emsp;&emsp;sortOrder|排序权重||false|integer(int32)||
|&emsp;&emsp;createBy|创建人||false|string||
|&emsp;&emsp;createTime|创建日期||false|string(date-time)||
|&emsp;&emsp;updateBy|更新人||false|string||
|&emsp;&emsp;updateTime|更新日期||false|string(date-time)||
|&emsp;&emsp;delFlag|删除状态||false|integer(int32)||
|&emsp;&emsp;platformAgentSubtoolList|||false|array|PlatformAgentSubtool|
|&emsp;&emsp;&emsp;&emsp;id|主键||false|string||
|&emsp;&emsp;&emsp;&emsp;agentToolId|所属Agent工具ID||false|string||
|&emsp;&emsp;&emsp;&emsp;refType|子工具来源表名||false|string||
|&emsp;&emsp;&emsp;&emsp;refId|子工具ID||false|string||
|&emsp;&emsp;&emsp;&emsp;enabled|是否启用||false|integer(int32)||
|&emsp;&emsp;&emsp;&emsp;config|参数覆盖值||false|string||
|&emsp;&emsp;&emsp;&emsp;createBy|创建人||false|string||
|&emsp;&emsp;&emsp;&emsp;createTime|创建日期||false|string(date-time)||
|&emsp;&emsp;&emsp;&emsp;updateBy|更新人||false|string||
|&emsp;&emsp;&emsp;&emsp;updateTime|更新日期||false|string(date-time)||
|&emsp;&emsp;&emsp;&emsp;delFlag|删除状态||false|integer(int32)||


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



## Agent工具子工具-主表ID查询


**接口地址**:`/specify/specifysystem/agentTools/platformAgentTool/queryPlatformAgentSubtoolByMainId`


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
|200|OK|ResultListPlatformAgentSubtool|
|401|Unauthorized|ResultObject|


**响应状态码-200**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|success|成功标志|boolean||
|message|返回处理消息|string||
|code|返回代码|integer(int32)|integer(int32)|
|result|返回数据对象|array|PlatformAgentSubtool|
|&emsp;&emsp;id|主键|string||
|&emsp;&emsp;agentToolId|所属Agent工具ID|string||
|&emsp;&emsp;refType|子工具来源表名|string||
|&emsp;&emsp;refId|子工具ID|string||
|&emsp;&emsp;enabled|是否启用|integer(int32)||
|&emsp;&emsp;config|参数覆盖值|string||
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
	"result": [
		{
			"id": "",
			"agentToolId": "",
			"refType": "",
			"refId": "",
			"enabled": 0,
			"config": "",
			"createBy": "",
			"createTime": "",
			"updateBy": "",
			"updateTime": "",
			"delFlag": 0
		}
	],
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



## Agent工具-通过id查询


**接口地址**:`/specify/specifysystem/agentTools/platformAgentTool/queryById`


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
|200|OK|ResultPlatformAgentTool|
|401|Unauthorized|ResultObject|


**响应状态码-200**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|success|成功标志|boolean||
|message|返回处理消息|string||
|code|返回代码|integer(int32)|integer(int32)|
|result||PlatformAgentTool|PlatformAgentTool|
|&emsp;&emsp;id|主键|string||
|&emsp;&emsp;displayName|展示名称|string||
|&emsp;&emsp;description|一句话描述|string||
|&emsp;&emsp;detail|详细说明|string||
|&emsp;&emsp;category|工具模板|string||
|&emsp;&emsp;config|配置参数值|string||
|&emsp;&emsp;instanceLevel|实例化策略|integer(int32)||
|&emsp;&emsp;fileAccess|文件访问模式|string||
|&emsp;&emsp;fileAccessDirs|文件访问目录列表（JSON数组），配合fileAccess使用|string||
|&emsp;&emsp;modelGroups|支持的模型分组|string||
|&emsp;&emsp;visible|是否在工具列表显示|integer(int32)||
|&emsp;&emsp;status|工具状态|integer(int32)||
|&emsp;&emsp;defaultEnabled|新App是否默认启用|integer(int32)||
|&emsp;&emsp;allowSubAgentUse|是否允许被子Agent使用|integer(int32)||
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
		"fileAccess": "",
		"fileAccessDirs": "",
		"modelGroups": "",
		"visible": 0,
		"status": 0,
		"defaultEnabled": 0,
		"allowSubAgentUse": 0,
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
## Agent工具-分页列表查询


**接口地址**:`/specify/specifysystem/agentTools/platformAgentTool/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|platformAgentTool|Agent工具|query|true|PlatformAgentTool|PlatformAgentTool|
|&emsp;&emsp;id|主键||false|string||
|&emsp;&emsp;displayName|展示名称||false|string||
|&emsp;&emsp;description|一句话描述||false|string||
|&emsp;&emsp;detail|详细说明||false|string||
|&emsp;&emsp;category|工具模板||false|string||
|&emsp;&emsp;config|配置参数值||false|string||
|&emsp;&emsp;instanceLevel|实例化策略||false|integer(int32)||
|&emsp;&emsp;fileAccess|文件访问模式||false|string||
|&emsp;&emsp;modelGroups|支持的模型分组||false|string||
|&emsp;&emsp;visible|是否在工具列表显示||false|integer(int32)||
|&emsp;&emsp;status|工具状态||false|integer(int32)||
|&emsp;&emsp;defaultEnabled|新App是否默认启用||false|integer(int32)||
|&emsp;&emsp;allowSubAgentUse|是否允许被子Agent使用||false|integer(int32)||
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
|200|OK|ResultIPagePlatformAgentTool|
|401|Unauthorized|ResultObject|


**响应状态码-200**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|success|成功标志|boolean||
|message|返回处理消息|string||
|code|返回代码|integer(int32)|integer(int32)|
|result||IPagePlatformAgentTool|IPagePlatformAgentTool|
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||
|&emsp;&emsp;records||array|PlatformAgentTool|
|&emsp;&emsp;&emsp;&emsp;id|主键|string||
|&emsp;&emsp;&emsp;&emsp;displayName|展示名称|string||
|&emsp;&emsp;&emsp;&emsp;description|一句话描述|string||
|&emsp;&emsp;&emsp;&emsp;detail|详细说明|string||
|&emsp;&emsp;&emsp;&emsp;category|工具模板|string||
|&emsp;&emsp;&emsp;&emsp;config|配置参数值|string||
|&emsp;&emsp;&emsp;&emsp;instanceLevel|实例化策略|integer(int32)||
|&emsp;&emsp;&emsp;&emsp;fileAccess|文件访问模式|string||
|&emsp;&emsp;&emsp;&emsp;modelGroups|支持的模型分组|string||
|&emsp;&emsp;&emsp;&emsp;visible|是否在工具列表显示|integer(int32)||
|&emsp;&emsp;&emsp;&emsp;status|工具状态|integer(int32)||
|&emsp;&emsp;&emsp;&emsp;defaultEnabled|新App是否默认启用|integer(int32)||
|&emsp;&emsp;&emsp;&emsp;allowSubAgentUse|是否允许被子Agent使用|integer(int32)||
|&emsp;&emsp;&emsp;&emsp;sortOrder|排序权重|integer(int32)||
|&emsp;&emsp;&emsp;&emsp;createBy|创建人|string||
|&emsp;&emsp;&emsp;&emsp;createTime|创建日期|string(date-time)||
|&emsp;&emsp;&emsp;&emsp;updateBy|更新人|string||
|&emsp;&emsp;&emsp;&emsp;updateTime|更新日期|string(date-time)||
|&emsp;&emsp;&emsp;&emsp;delFlag|删除状态|integer(int32)||
|timestamp|时间戳|integer(int64)|integer(int64)|


**响应示例**:
```javascript
{
	"success": true,
	"message": "",
	"code": 0,
	"result": {
		"current": 0,
		"size": 0,
		"pages": 0,
		"total": 0,
		"records": [
			{
				"id": "",
				"displayName": "",
				"description": "",
				"detail": "",
				"category": "",
				"config": "",
				"instanceLevel": 0,
				"fileAccess": "",
				"modelGroups": "",
				"visible": 0,
				"status": 0,
				"defaultEnabled": 0,
				"allowSubAgentUse": 0,
				"sortOrder": 0,
				"createBy": "",
				"createTime": "",
				"updateBy": "",
				"updateTime": "",
				"delFlag": 0
			}
		]
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


## Agent工具-通过id删除


**接口地址**:`/specify/specifysystem/agentTools/platformAgentTool/delete`


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



## Agent工具子工具-主表ID查询


**接口地址**:`/specify/specifysystem/agentTools/platformAgentTool/queryPlatformAgentSubtoolByMainId`


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
|200|OK|ResultListPlatformAgentSubtool|
|401|Unauthorized|ResultObject|


**响应状态码-200**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|success|成功标志|boolean||
|message|返回处理消息|string||
|code|返回代码|integer(int32)|integer(int32)|
|result|返回数据对象|array|PlatformAgentSubtool|
|&emsp;&emsp;id|主键|string||
|&emsp;&emsp;agentToolId|所属Agent工具ID|string||
|&emsp;&emsp;refType|子工具来源表名|string||
|&emsp;&emsp;refId|子工具ID|string||
|&emsp;&emsp;enabled|是否启用|integer(int32)||
|&emsp;&emsp;config|参数覆盖值|string||
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
	"result": [
		{
			"id": "",
			"agentToolId": "",
			"refType": "",
			"refId": "",
			"enabled": 0,
			"config": "",
			"createBy": "",
			"createTime": "",
			"updateBy": "",
			"updateTime": "",
			"delFlag": 0
		}
	],
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