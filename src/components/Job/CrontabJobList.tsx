import * as React from 'react'
import { Table, Button, Popover, Icon, Input } from 'antd'
import { time, getRequest } from '../../utils/utils'
import API from '../../config/api'
import ModalTemple from '../modal'
import Status from 'src/config/status'

interface JobInfo {
    history: any
    addr: string
    jobData: any[]
    currentKey: string
    loading: boolean
    changeLoading: any
    reload: any
    total: number
    page: number
    pageSize: number
}

interface Data {
    searchTxt: string
    userInfo: any
    token: string | null
}

interface State {
    selectedRowKeys: any[]
    execModalVisible: boolean
    execModalData: any[]
}

class CrontabJobList extends React.Component<JobInfo> {
    constructor(props: JobInfo) {
        super(props)
    }

    public data: Data = {
        searchTxt: '',
        token: '',
        userInfo: JSON.parse('{}')
    }

    state: State = {
        selectedRowKeys: [],
        execModalVisible: false,
        execModalData: []
    }

    public componentDidMount() {
        if (window.localStorage) {
            this.data.token = localStorage.getItem('jiaToken')
            this.data.userInfo = JSON.parse(
                localStorage.getItem('userInfo') || '{}'
            )
        }
    }

    private start = () => {
        this.props.changeLoading(true)
        this.controlAction(this.props.addr, this.state.selectedRowKeys, 'start')
    }
    private stop = () => {
        this.props.changeLoading(true)
        this.controlAction(this.props.addr, this.state.selectedRowKeys, 'stop')
    }

    private delete = () => {
        this.props.changeLoading(true)
        this.controlAction(
            this.props.addr,
            this.state.selectedRowKeys,
            'delete'
        )
    }
    private audit = () => {
        this.props.changeLoading(true)
        this.auditJob(this.props.addr, this.state.selectedRowKeys, 'crontab')
    }

    private add = () => {
        let params: any = {
            id: '',
            addr: this.props.addr,
            tabKey: this.props.currentKey
        }
        let path: any = {
            pathname: '/edit/crontab_job',
            search: `?id=${params.id}&addr=${params.addr}&tabKey=${
                params.tabKey
                }`
        }
        this.props.history.push(path)
    }
    private seeLog = (logId: number) => {
        let params: any = {
            id: logId,
            addr: this.props.addr,
            tabKey: this.props.currentKey,
            date: ''
        }
        let path: any = {
            pathname: '/log',
            search: `?id=${params.id}&addr=${params.addr}&tabKey=${
                params.tabKey
                }&date=${params.date}`
        }
        this.props.history.push(path)
    }
    private startTask = (record: any) => {
        let startArray = []
        this.props.changeLoading(true)
        startArray.push(record.ID)
        this.controlAction(this.props.addr, startArray, 'start')
    }
    private stopTask = (record: any) => {
        let stopArray = []
        this.props.changeLoading(true)
        stopArray.push(record.ID)
        this.controlAction(this.props.addr, stopArray, 'stop')
    }
    private downMenu = (record: any) => {
        if (
            record.status === Status.StatusJobUnaudited &&
            !this.data.userInfo.root &&
            this.data.userInfo.groupID !== 1
        ) {
            return (
                <div className="down-menu">
                    <p
                        onClick={() => {
                            this.handleMenuClick(record, 'editor')
                        }}
                    >
                        编辑定时任务
                    </p>
                    <p
                        onClick={() => {
                            this.handleMenuClick(record, 'delete')
                        }}
                    >
                        删除定时任务
                    </p>
                    <p
                        onClick={() => {
                            this.handleMenuClick(record, 'kill')
                        }}
                    >
                        强杀脚本进程
                    </p>
                    <p
                        onClick={() => {
                            this.handleMenuClick(record, 'log')
                        }}
                    >
                        查看最近日志
                    </p>
                </div>
            )
        }
        return (
            <div className="down-menu">
                <p
                    onClick={() => {
                        this.handleMenuClick(record, 'editor')
                    }}
                >
                    编辑定时任务
                </p>
                <p
                    onClick={() => {
                        this.handleMenuClick(record, 'delete')
                    }}
                >
                    删除定时任务
                </p>
                <p
                    onClick={() => {
                        this.handleMenuClick(record, 'exec')
                    }}
                >
                    手动执行任务
                </p>
                <p
                    onClick={() => {
                        this.handleMenuClick(record, 'kill')
                    }}
                >
                    强杀脚本进程
                </p>
                <p
                    onClick={() => {
                        this.handleMenuClick(record, 'log')
                    }}
                >
                    查看最近日志
                </p>
            </div>
        )
    }
    private handleMenuClick = (record: any, type: string) => {
        let idArray = []
        let params: any = {
            id: record.ID,
            addr: this.props.addr,
            tabKey: this.props.currentKey
        }
        let path: any = {
            pathname: '/edit/crontab_job',
            search: `?id=${params.id}&addr=${params.addr}&tabKey=${
                params.tabKey
                }`
        }

        if (type == 'editor') {
            this.props.history.push(path)
        }
        if (type == 'delete') {
            this.props.changeLoading(true)
            idArray.push(record.ID)
            this.controlAction(this.props.addr, idArray, 'delete')
        }
        if (type == 'kill') {
            this.props.changeLoading(true)
            idArray.push(record.ID)
            this.controlAction(this.props.addr, idArray, 'kill')
        }
        if (type == 'exec') {
            this.controlExec(this.props.addr, record.ID)
        }
        if (type == 'log') {
            this.seeLog(record.ID)
        }
    }
    public controlAction = (addr: string, jobIDs: number[], action: string) => {
        getRequest({
            url: API.action,
            token: this.data.token,
            data: {
                addr,
                jobIDs,
                action
            },
            succ: (data: any) => {
                this.setState(
                    {
                        selectedRowKeys: []
                    },
                    () => {
                        this.props.reload(
                            this.data.searchTxt,
                            this.props.page,
                            this.props.pageSize
                        )
                        this.props.changeLoading(false)
                    }
                )
            },
            error: () => {
                this.setState({
                    selectedRowKeys: []
                })
                this.props.changeLoading(false)
            },
            catch: () => {
                this.setState({
                    selectedRowKeys: []
                })
                this.props.changeLoading(false)
            }
        })
    }
    private auditJob = (addr: string, jobIDs: number[], jobType: string) => {
        getRequest({
            url: API.auditJob,
            token: this.data.token,
            data: {
                addr,
                jobIDs,
                jobType
            },
            succ: (data: any) => {
                this.setState(
                    {
                        selectedRowKeys: []
                    },
                    () => {
                        this.props.reload(
                            this.data.searchTxt,
                            this.props.page,
                            this.props.pageSize
                        )
                        this.props.changeLoading(false)
                    }
                )
            },
            error: () => {
                this.setState({
                    selectedRowKeys: []
                })
                this.props.changeLoading(false)
            },
            catch: () => {
                this.setState({
                    selectedRowKeys: []
                })
                this.props.changeLoading(false)
            }
        })
    }
    public controlExec = (addr: string, jobID: number[]) => {
        getRequest({
            url: API.exec,
            token: this.data.token,
            data: {
                addr,
                jobID
            },
            succ: (data: any) => {
                this.setState({
                    execModalVisible: true,
                    execModalData: JSON.parse(data)
                })
            },
            error: () => {
                this.setState({
                    selectedRowKeys: []
                })
                this.props.changeLoading(false)
            },
            catch: () => {
                this.setState({
                    selectedRowKeys: []
                })
                this.props.changeLoading(false)
            }
        })
    }
    private getTypeButton = (record: any) => {
        const stopEle = (
            <Button
                size="small"
                href="javascript:;"
                type="danger"
                style={{ marginRight: 10 }}
                onClick={() => {
                    this.stopTask(record)
                }}
            >
                停止
            </Button>
        )
        const startEle = (
            <Button
                href="javascript:;"
                size="small"
                type="primary"
                style={{ marginRight: 10 }}
                onClick={() => {
                    this.startTask(record)
                }}
            >
                启动
            </Button>
        )

        let startEleDisabled = (
            <Button
                href="javascript:;"
                size="small"
                type="primary"
                htmlType="button"
                style={{ marginRight: 10 }}
                disabled={true}
            >
                启动
            </Button>
        )

        const btnTyps = {
            0: startEleDisabled,
            1: startEle,
            2: stopEle,
            3: stopEle,
            4: startEle
        }

        return btnTyps[record.status]
    }
    private modalOk = () => {
        this.props.changeLoading(true)
        this.setState(
            {
                selectedRowKeys: [],
                execModalVisible: false
            },
            () => {
                this.props.reload(
                    this.data.searchTxt,
                    this.props.page,
                    this.props.pageSize
                )
            }
        )
    }
    private modalCanel = () => {
        this.setState(
            {
                selectedRowKeys: [],
                execModalVisible: false
            },
            () => {
                this.props.reload(
                    this.data.searchTxt,
                    this.props.page,
                    this.props.pageSize
                )
            }
        )
    }
    public render(): any {
        const { selectedRowKeys } = this.state

        const runColumns: any[] = [
            {
                title: 'ID',
                dataIndex: 'ID',
                width: 50,
                key: 'ID'
            },
            {
                title: '名称',
                dataIndex: 'name',
                width: 'auto',
                key: 'name'
            },
            {
                title: '状态',
                dataIndex: 'status',
                width: 65,
                key: 'status',
                render: (text: any) => {
                    let ele: any = ''
                    if (text == '0')
                        ele = (
                            <span
                                className="running"
                                style={{ background: '#f50' }}
                            >
                                {'未审核'}
                            </span>
                        )
                    if (text == '1')
                        ele = (
                            <span
                                className="running"
                                style={{ background: '#2db7f5' }}
                            >
                                {'已审核'}
                            </span>
                        )
                    if (text == '2')
                        ele = (
                            <span
                                className="running"
                                style={{ background: '#108ee9' }}
                            >
                                {'计时中'}
                            </span>
                        )
                    if (text == '3')
                        ele = (
                            <span
                                className="running"
                                style={{ background: '#87d068' }}
                            >
                                {'执行中'}
                            </span>
                        )
                    if (text == '4')
                        ele = (
                            <span
                                className="running"
                                style={{ background: 'gray' }}
                            >
                                {'已停止'}
                            </span>
                        )
                    return ele
                }
            },
            {
                title: '定时',
                key: 'timer',
                width: 80,
                render: (record: any) => (
                    <span>
                        {record.timeArgs.second} {record.timeArgs.minute}{' '}
                        {record.timeArgs.hour} {record.timeArgs.day}{' '}
                        {record.timeArgs.weekday} {record.timeArgs.month}
                    </span>
                )
            },
            {
                title: '进程',
                width: 50,
                dataIndex: 'processNum',
                key: 'processNum'
            },
            {
                title: '执行状态',
                dataIndex: 'lastExitStatus',
                key: 'lastExitStatus',
                render: (record: string) => {
                    if (record === '') {
                        return (
                            <span style={{ background: '#87d068' }}>
                                success
                            </span>
                        )
                    } else {
                        return (
                            <span style={{ background: '#f50' }}>{record}</span>
                        )
                    }
                }
            },

            {
                title: '上次执行',
                dataIndex: 'lastExecTime',
                key: 'lastExecTime',
                render: (record: string) => (
                    <span>{time.UTCToTime(record)}</span>
                )
            },
            {
                title: '下次执行',
                dataIndex: 'nextExecTime',
                key: 'nextExecTime',
                render: (record: string) => (
                    <span>{time.UTCToTime(record)}</span>
                )
            },
            {
                title: '运行时间',
                dataIndex: 'lastCostTime',
                key: 'lastCostTime',
                render: (record: string) => (
                    <span>{record + 's'}</span>
                )
            },
            {
                title: '最近更新',
                dataIndex: 'updatedUsername',
                key: 'updatedUsername'
            },
            {
                title: '编辑',
                width: '140px',
                key: 'operation',
                render: (record: any) => {
                    return record.createdUserId !== this.data.userInfo.userID &&
                        !this.data.userInfo.root &&
                        this.data.userInfo.groupID !== 1 ? (
                            <span>--</span>
                        ) : (
                            <React.Fragment>
                                {this.getTypeButton(record)}
                                {(() => {
                                    return (
                                        <Popover
                                            placement="bottomRight"
                                            content={this.downMenu(record)}
                                            trigger="hover"
                                        >
                                            <Button size="small">
                                                更多
                                            <Icon
                                                    type="down"
                                                    style={{ fontSize: 12 }}
                                                />
                                            </Button>
                                        </Popover>
                                    )
                                })()}
                            </React.Fragment>
                        )
                }
            }
        ]

        const runData: any[] = this.props.jobData

        const rowSelection: any = {
            selectedRowKeys,
            onChange: (selectedRowKeys: any, selectedRows: any) => {
                this.setState({ selectedRowKeys })
            },
            getCheckboxProps: (record: any) => ({
                disabled:
                    record.createdUserId !== this.data.userInfo.userID &&
                    !this.data.userInfo.root &&
                    this.data.userInfo.groupID !== 1, // Column configuration not to be checked
                createdUserId: record.createdUserId
            })
        }
        const hasSelected = this.state.selectedRowKeys.length > 0
        const { Search } = Input
        return (
            <div
                className="crontab-job-page"
            // style={{ height: 'calc(100% - 60px)', overflowY: 'auto' }}
            >
                <div className="table-btn">
                    <Search
                        placeholder="任务名"
                        onSearch={value => {
                            this.data.searchTxt = value
                            this.props.reload(
                                this.data.searchTxt,
                                1,
                                this.props.pageSize
                            )
                        }}
                        enterButton="查询"
                        style={{ width: 350 }}
                    />
                    <Button
                        type="primary"
                        href="javascript:;"
                        onClick={this.add}
                        style={{ float: 'right' }}
                    >
                        添加
                    </Button>
                    <Button
                        type="primary"
                        htmlType="button"
                        href="javascript:;"
                        onClick={this.start}
                        disabled={!hasSelected}
                        style={{ float: 'right', marginRight: 10 }}
                    >
                        启动
                    </Button>
                    <Button
                        type="primary"
                        htmlType="button"
                        href="javascript:;"
                        onClick={this.stop}
                        disabled={!hasSelected}
                        className="stop-button"
                        style={{ float: 'right', marginRight: 10 }}
                    >
                        停止
                    </Button>
                    <Button
                        href="javascript:;"
                        type="primary"
                        htmlType="button"
                        onClick={this.delete}
                        disabled={!hasSelected}
                        className="delete-button"
                        style={{ float: 'right', marginRight: 10 }}
                    >
                        删除
                    </Button>
                    {this.data.userInfo.groupID === 1 ||
                        this.data.userInfo.root ? (
                            <Button
                                href="javascript:;"
                                type="primary"
                                htmlType="button"
                                onClick={this.audit}
                                disabled={!hasSelected}
                                className="audit-button"
                                style={{ float: 'right', marginRight: 10 }}
                            >
                                审核
                        </Button>
                        ) : null}
                </div>
                <Table
                    style={{
                        wordWrap: 'break-word',
                        wordBreak: 'break-all'
                    }}
                    bordered
                    size="small"
                    rowKey="ID"
                    pagination={{
                        total: this.props.total,
                        pageSize: this.props.pageSize,
                        defaultCurrent: this.props.page,
                        showSizeChanger: true,
                        pageSizeOptions: ['1', '10', '20', '50', '100'],
                        onShowSizeChange: (
                            current: number,
                            pageSize: number
                        ) => {
                            this.props.reload(this.data.searchTxt, 1, pageSize)
                        },
                        onChange: (page: number) => {
                            this.props.reload(
                                this.data.searchTxt,
                                page,
                                this.props.pageSize
                            )
                        }
                    }}
                    loading={this.props.loading}
                    dataSource={runData}
                    columns={runColumns}
                    rowSelection={rowSelection}
                // scroll={{ y: '5000px' }}
                />
                <ModalTemple
                    visible={this.state.execModalVisible}
                    handleOk={() => {
                        this.modalOk()
                    }}
                    handleCancel={() => {
                        this.modalCanel()
                    }}
                    modalListData={this.state.execModalData}
                />
            </div>
        )
    }
}

export default CrontabJobList
