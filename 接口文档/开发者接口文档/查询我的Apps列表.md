

## 查询我的 Apps 列表


**接口地址**:`/specify/specifyuser/app/listMyApps`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>分页查询当前登录用户创建的所有 App，自动解析每个 App 的模型分组名称。
模型分组优先取已发布版本（liveVersionId → app_versions.model_group_id），
其次取草稿配置（draft_config.modelGroupId）。</p>
<p>返回字段：id, name, description, modelGroupId, modelGroupName, liveVersionId, shareCode, isPublic, createTime, updateTime</p>



**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|pageNo|页码，从 1 开始，默认 1|query|false|string||
|pageSize|每页条数，范围 1-100，默认 10|query|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|分页 App 列表，空列表返回空页|ResultIPageAppListVO|
|401|Unauthorized|ResultObject|


**响应状态码-200**:


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|success|成功标志|boolean||
|message|返回处理消息|string||
|code|返回代码|integer(int32)|integer(int32)|
|result||IPageAppListVO|IPageAppListVO|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records||array|AppListVO|
|&emsp;&emsp;&emsp;&emsp;id|App ID|string||
|&emsp;&emsp;&emsp;&emsp;name|App 名称|string||
|&emsp;&emsp;&emsp;&emsp;description|App 描述|string||
|&emsp;&emsp;&emsp;&emsp;modelGroupId|模型分组 ID|string||
|&emsp;&emsp;&emsp;&emsp;modelGroupName|模型分组名称|string||
|&emsp;&emsp;&emsp;&emsp;liveVersionId|线上版本 ID|string||
|&emsp;&emsp;&emsp;&emsp;shareCode|分享码|string||
|&emsp;&emsp;&emsp;&emsp;isPublic|是否公开|integer(int32)||
|&emsp;&emsp;&emsp;&emsp;createTime|创建时间|string(date-time)||
|&emsp;&emsp;&emsp;&emsp;updateTime|更新时间|string(date-time)||
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
				"name": "",
				"description": "",
				"modelGroupId": "",
				"modelGroupName": "",
				"liveVersionId": "",
				"shareCode": "",
				"isPublic": 0,
				"createTime": "",
				"updateTime": ""
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