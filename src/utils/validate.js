/**
 * 表单验证规则
 */

// 手机号验证
export function validatePhone(rule, value, callback) {
  if (!value) {
    callback()
    return
  }
  const reg = /^1[3-9]\d{9}$/
  if (!reg.test(value)) {
    callback(new Error('请输入正确的手机号'))
  } else {
    callback()
  }
}

// 邮箱验证
export function validateEmail(rule, value, callback) {
  if (!value) {
    callback()
    return
  }
  const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!reg.test(value)) {
    callback(new Error('请输入正确的邮箱地址'))
  } else {
    callback()
  }
}

// 密码验证（6-20位，包含字母和数字）
export function validatePassword(rule, value, callback) {
  if (!value) {
    callback(new Error('请输入密码'))
    return
  }
  const reg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/
  if (!reg.test(value)) {
    callback(new Error('密码为6-20位，需包含字母和数字'))
  } else {
    callback()
  }
}

// 常用验证规则
export const rules = {
  // 必填
  required: (message = '此项为必填项') => ({
    required: true,
    message,
    trigger: 'blur'
  }),

  // 必选
  requiredSelect: (message = '此项为必选项') => ({
    required: true,
    message,
    trigger: 'change'
  }),

  // 手机号
  phone: [
    { required: false },
    { validator: validatePhone, trigger: 'blur' }
  ],

  // 邮箱
  email: [
    { required: false },
    { validator: validateEmail, trigger: 'blur' }
  ],

  // 用户名（4-20位字母数字下划线）
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '长度在4到20个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '只能包含字母、数字和下划线', trigger: 'blur' }
  ],

  // 密码
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在6到20个字符', trigger: 'blur' }
  ],

  // 链接地址
  url: [
    { type: 'url', message: '请输入正确的URL地址', trigger: 'blur' }
  ]
}