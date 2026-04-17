# 🚀 两周快速入手 Golang —— Java 开发者专属学习攻略

> **适用对象**：5年 Java 开发经验，希望在两周内掌握 Go 基础并能独立编写简单项目
> **每日学习时间**：2-3 小时（在职开发者节奏）
> **最终目标**：能看懂 Go 代码 + 能独立编写 RESTful API 项目

---

## 目录

- [学习前准备](#学习前准备)
- [Java vs Go 核心差异速览](#java-vs-go-核心差异速览)
- [第一周：基础篇（Day 1-7）](#第一周基础篇day-1-7)
- [第二周：实战篇（Day 8-14）](#第二周实战篇day-8-14)
- [Java 开发者常见陷阱清单](#java-开发者常见陷阱清单)
- [推荐资源汇总](#推荐资源汇总)

---

## 学习前准备

### 环境搭建

```bash
# 1. 安装 Go（推荐 1.21+）
# macOS
brew install go

# 验证安装
go version

# 2. 配置环境变量（~/.zshrc）
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin

# 3. 配置 Go Module 代理（国内加速）
go env -w GOPROXY=https://goproxy.cn,direct
```

### 开发工具

| 工具 | 说明 |
|------|------|
| **GoLand**（推荐） | JetBrains 出品，Java 开发者最熟悉的 IDE 风格 |
| **VS Code + Go 插件** | 轻量级选择，安装 `Go` 官方插件即可 |
| **CodeBuddy** | AI 辅助编程，加速学习 |

### 第一个 Go 程序

```go
// main.go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!")
}
```

```bash
# 运行
go run main.go

# 编译
go build -o hello main.go
./hello
```

> 💡 **Java 对照**：Go 没有 `public static void main(String[] args)`，直接 `func main()` 就行。Go 编译成原生二进制，不需要 JVM。

---

## Java vs Go 核心差异速览

| 维度 | Java | Go |
|------|------|-----|
| **类型系统** | 面向对象（class 继承） | 组合优于继承（struct + interface） |
| **异常处理** | try-catch-finally | 多返回值 `(result, error)` |
| **并发模型** | Thread / ExecutorService | goroutine + channel（CSP 模型） |
| **内存管理** | JVM GC | Go Runtime GC（更简单） |
| **包管理** | Maven / Gradle | Go Modules (`go.mod`) |
| **泛型** | Java 5 引入泛型 | Go 1.18 引入泛型（较新） |
| **接口** | 显式实现 `implements` | 隐式实现（鸭子类型） |
| **访问控制** | public/private/protected | 首字母大写=公开，小写=私有 |
| **空值** | null + NullPointerException | nil（更安全的零值机制） |
| **编译** | 编译为字节码，JVM 运行 | 直接编译为机器码 |
| **构造函数** | `new ClassName()` | 工厂函数 `NewXxx()` 惯例 |
| **getter/setter** | `getX() / setX()` | 直接访问字段（Go 推崇简洁） |
| **枚举** | `enum` 关键字 | `const + iota` |
| **项目结构** | `src/main/java/...` 深层目录 | 扁平目录，按功能分包 |

---

## 第一周：基础篇（Day 1-7）

---

### Day 1：变量、类型与控制流

**学习目标**：掌握 Go 的基本语法，理解与 Java 的差异

#### 1.1 变量声明

```go
// Go 的变量声明方式（对比 Java 的 int x = 10;）

// 方式一：完整声明
var name string = "Alice"

// 方式二：类型推断（最常用 ✅）
age := 25  // 等价于 Java 的 var age = 25;（Java 10+）

// 方式三：批量声明
var (
    host   string = "localhost"
    port   int    = 8080
    debug  bool   = true
)

// 常量
const Pi = 3.14159
const (
    StatusOK    = 200
    StatusError = 500
)
```

> 💡 **Java 对照**：`:=` 是 Go 最常用的声明方式，类似 Java 10 的 `var`，但更简洁。Go 中未使用的变量会**编译报错**（Java 只是警告）。

#### 1.2 基本类型

```go
// 数值类型
var i int = 42        // 平台相关（32/64位）
var i64 int64 = 42    // 明确64位
var f float64 = 3.14  // 默认浮点类型
var b byte = 'A'      // uint8 的别名

// 字符串（不可变，同 Java String）
s := "Hello, Go"
length := len(s)            // 字节长度
runeLen := utf8.RuneCountInString(s) // 字符长度

// 布尔
var flag bool = true

// 零值机制（Go 独有，非常重要！）
var x int     // 0（不是 null！）
var s string  // ""（空字符串，不是 null！）
var b bool    // false
var p *int    // nil（只有指针/引用类型才是 nil）
```

> 💡 **零值 vs null**：Go 没有 `null`，所有类型都有零值。`int` 的零值是 `0`，`string` 的零值是 `""`。只有指针、slice、map、channel、interface 的零值是 `nil`。

#### 1.3 控制流

```go
// if-else（不需要括号！）
if age >= 18 {
    fmt.Println("adult")
} else {
    fmt.Println("minor")
}

// if 带初始化语句（Go 独有，非常实用）
if err := doSomething(); err != nil {
    fmt.Println("error:", err)
}

// for 循环（Go 只有 for，没有 while）
for i := 0; i < 10; i++ {
    fmt.Println(i)
}

// for 当 while 用
count := 0
for count < 10 {
    count++
}

// 无限循环
for {
    // 相当于 Java 的 while(true)
    break
}

// range 遍历（类似 Java 的 for-each）
nums := []int{1, 2, 3, 4, 5}
for index, value := range nums {
    fmt.Printf("index=%d, value=%d\n", index, value)
}

// switch（默认 break，不需要写！）
switch day := "Monday"; day {
case "Monday":
    fmt.Println("周一")  // 自动 break
case "Friday":
    fmt.Println("周五")
default:
    fmt.Println("其他")
}
```

> 💡 **Java 对照**：Go 的 `switch` 默认每个 case 自动 break，如果要穿透用 `fallthrough`（和 Java 相反）。Go 没有 `while`，用 `for` 代替一切循环。

#### 📝 Day 1 练习

- **必做**：写一个程序，输入年份判断是否为闰年
- **必做**：用 `for` + `range` 遍历一个字符串，打印每个字符及其 Unicode 值
- **进阶**：实现 FizzBuzz（1-100，3的倍数打印Fizz，5的倍数打印Buzz，同时是3和5的倍数打印FizzBuzz）

---

### Day 2：函数与错误处理

**学习目标**：掌握 Go 函数特性和独特的错误处理模式

#### 2.1 函数定义

```go
// 基本函数
func add(a int, b int) int {
    return a + b
}

// 参数类型相同可简写
func add(a, b int) int {
    return a + b
}

// 多返回值（Go 核心特色！！！）
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("division by zero")
    }
    return a / b, nil
}

// 调用多返回值函数
result, err := divide(10, 3)
if err != nil {
    log.Fatal(err)
}
fmt.Println(result)

// 命名返回值
func swap(a, b string) (first, second string) {
    first = b
    second = a
    return // 裸 return，返回命名变量
}

// 不定参数（类似 Java 的可变参数）
func sum(nums ...int) int {
    total := 0
    for _, n := range nums {
        total += n
    }
    return total
}
```

> 💡 **Java 对照**：Java 只能返回一个值（或用包装类），Go 可以直接返回多个值。这是 Go 错误处理的基础——`(result, error)` 模式。

#### 2.2 函数是一等公民

```go
// 函数作为变量（类似 Java 的 Function 接口，但更简洁）
var greet func(string) string
greet = func(name string) string {
    return "Hello, " + name
}

// 匿名函数 + 立即执行
result := func(a, b int) int {
    return a + b
}(3, 4)

// 函数作为参数（类似 Java 的 Lambda）
func apply(nums []int, fn func(int) int) []int {
    result := make([]int, len(nums))
    for i, v := range nums {
        result[i] = fn(v)
    }
    return result
}

doubled := apply([]int{1, 2, 3}, func(n int) int {
    return n * 2
})

// 闭包
func counter() func() int {
    count := 0
    return func() int {
        count++
        return count
    }
}

c := counter()
fmt.Println(c()) // 1
fmt.Println(c()) // 2
fmt.Println(c()) // 3
```

#### 2.3 错误处理（核心重点！）

```go
// Go 的错误处理哲学：显式检查，不要隐藏错误

// 标准模式
result, err := doSomething()
if err != nil {
    return fmt.Errorf("doSomething failed: %w", err) // %w 包装错误
}

// 自定义错误类型
type NotFoundError struct {
    ID   int
    Name string
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s with ID %d not found", e.Name, e.ID)
}

// 使用自定义错误
func findUser(id int) (*User, error) {
    user := db.Find(id)
    if user == nil {
        return nil, &NotFoundError{ID: id, Name: "User"}
    }
    return user, nil
}

// 错误判断
user, err := findUser(42)
if err != nil {
    var notFound *NotFoundError
    if errors.As(err, &notFound) {
        // 处理 404
        fmt.Println(notFound.Name, "not found")
    } else {
        // 处理其他错误
        log.Fatal(err)
    }
}

// defer + recover 处理 panic（类似 Java 的 try-catch，但只用于不可恢复错误）
func safeDiv(a, b int) (result int, err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("panic recovered: %v", r)
        }
    }()
    return a / b, nil
}
```

> 💡 **Java 对照**：
> - Java: `try { ... } catch (Exception e) { ... }`
> - Go: `result, err := fn(); if err != nil { ... }`
> - Go 没有异常机制，错误就是普通的返回值。`panic/recover` 类似 Java 的 RuntimeException，但只用于真正的程序错误，不用于业务逻辑。

#### 2.4 defer 关键字

```go
// defer 延迟执行（函数返回前执行，类似 Java 的 try-with-resources）
func readFile(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return err
    }
    defer f.Close() // 函数返回前一定会执行，不用担心忘记关闭

    // 读取文件...
    return nil
}

// 多个 defer 按 LIFO（后进先出）顺序执行
func demo() {
    defer fmt.Println("first")
    defer fmt.Println("second")
    defer fmt.Println("third")
    // 输出：third, second, first
}
```

> 💡 **Java 对照**：`defer` 替代了 Java 的 `try-finally` 和 `try-with-resources`，代码更简洁。

#### 📝 Day 2 练习

- **必做**：实现一个 `calculator` 函数，接收两个数和操作符(+,-,*,/)，返回 `(float64, error)`
- **必做**：写一个文件读取函数，使用 `defer` 确保文件关闭，处理所有可能的错误
- **进阶**：实现一个重试函数 `retry(attempts int, fn func() error) error`，支持指定重试次数

---

### Day 3：结构体、方法与接口

**学习目标**：理解 Go 的"面向对象"方式——组合优于继承

#### 3.1 结构体（替代 Java 的 Class）

```go
// 定义结构体（类似 Java 的 POJO/DTO）
type User struct {
    ID        int
    Name      string
    Email     string
    CreatedAt time.Time
}

// 创建实例
u1 := User{ID: 1, Name: "Alice", Email: "alice@example.com"}
u2 := User{Name: "Bob"} // 其他字段为零值
u3 := new(User)          // 返回 *User，所有字段为零值

// 工厂函数（替代 Java 构造函数）
func NewUser(name, email string) *User {
    return &User{
        ID:        generateID(),
        Name:      name,
        Email:     email,
        CreatedAt: time.Now(),
    }
}

// 嵌套结构体（Go 的"继承"方式：组合）
type Address struct {
    Street string
    City   string
}

type Employee struct {
    User           // 匿名嵌套，类似继承
    Address        // 可以嵌套多个
    Department string
}

emp := Employee{
    User:       User{Name: "Charlie"},
    Address:    Address{City: "Beijing"},
    Department: "Engineering",
}
// 可以直接访问嵌套字段
fmt.Println(emp.Name)  // 直接访问 User 的 Name
fmt.Println(emp.City)  // 直接访问 Address 的 City
```

> 💡 **Java 对照**：Go 没有 `class`，用 `struct` 代替。没有继承（`extends`），用**组合**（嵌套 struct）实现复用。没有构造函数，用 `NewXxx()` 工厂函数代替。

#### 3.2 方法（给 struct 加行为）

```go
// 值接收者方法
func (u User) FullInfo() string {
    return fmt.Sprintf("%s (%s)", u.Name, u.Email)
}

// 指针接收者方法（可以修改结构体字段）
func (u *User) UpdateEmail(email string) {
    u.Email = email // 修改原始对象
}

// 调用
user := NewUser("Alice", "alice@example.com")
fmt.Println(user.FullInfo())
user.UpdateEmail("newalice@example.com")
```

> 💡 **何时用指针接收者**：
> - 需要修改接收者 → 用 `*T`
> - 结构体很大，避免复制 → 用 `*T`
> - 保持一致性：如果一个方法用指针接收者，最好所有方法都用指针接收者

#### 3.3 接口（Go 最精髓的设计）

```go
// 接口定义（Java 需要 implements，Go 是隐式实现！）
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

// 接口组合
type ReadWriter interface {
    Reader
    Writer
}

// 自定义接口
type Storage interface {
    Save(key string, value []byte) error
    Load(key string) ([]byte, error)
    Delete(key string) error
}

// 实现接口（不需要 implements 关键字！）
type MemoryStorage struct {
    data map[string][]byte
}

func NewMemoryStorage() *MemoryStorage {
    return &MemoryStorage{data: make(map[string][]byte)}
}

func (m *MemoryStorage) Save(key string, value []byte) error {
    m.data[key] = value
    return nil
}

func (m *MemoryStorage) Load(key string) ([]byte, error) {
    v, ok := m.data[key]
    if !ok {
        return nil, fmt.Errorf("key %s not found", key)
    }
    return v, nil
}

func (m *MemoryStorage) Delete(key string) error {
    delete(m.data, key)
    return nil
}

// MemoryStorage 自动实现了 Storage 接口，无需声明！

// 面向接口编程
func SaveData(s Storage, key string, data []byte) error {
    return s.Save(key, data)
}
```

> 💡 **Java 对照**：
> - Java：`class MyStorage implements Storage { ... }`（显式声明）
> - Go：只要方法签名匹配，**自动实现**接口（鸭子类型）
> - 这意味着你可以为第三方类型定义接口，无需修改其源码！

#### 3.4 空接口与类型断言

```go
// 空接口 interface{} 等价于 Java 的 Object
// Go 1.18+ 可以用 any 代替 interface{}
func printAnything(v any) {
    fmt.Println(v)
}

// 类型断言（类似 Java 的 instanceof + 强制转换）
func describe(i interface{}) {
    switch v := i.(type) {
    case int:
        fmt.Printf("int: %d\n", v)
    case string:
        fmt.Printf("string: %s\n", v)
    case bool:
        fmt.Printf("bool: %t\n", v)
    default:
        fmt.Printf("unknown: %v\n", v)
    }
}

// 单个类型断言
val, ok := i.(string)
if ok {
    fmt.Println("is string:", val)
}
```

#### 📝 Day 3 练习

- **必做**：定义一个 `Shape` 接口（有 `Area()` 和 `Perimeter()` 方法），实现 `Circle` 和 `Rectangle`
- **必做**：用结构体嵌套实现一个"动物系统"：`Animal` 基础结构 + `Dog`、`Cat` 嵌套 Animal
- **进阶**：实现一个 `Logger` 接口，分别用 `ConsoleLogger` 和 `FileLogger` 实现，写一个函数接受 Logger 接口参数

---

### Day 4：指针、数组、切片与 Map

**学习目标**：掌握 Go 的核心数据结构，理解值类型与引用类型

#### 4.1 指针

```go
// Go 有指针，但没有指针运算（比 C 安全）
x := 42
p := &x    // 取地址
fmt.Println(*p) // 解引用：42
*p = 100
fmt.Println(x)  // 100

// 函数中的指针
func increment(n *int) {
    *n++
}

val := 10
increment(&val)
fmt.Println(val) // 11
```

> 💡 **Java 对照**：Java 没有显式指针，对象引用本质上就是指针。Go 的指针让你能明确控制**值传递**和**引用传递**。

#### 4.2 数组与切片

```go
// 数组（固定长度，很少直接使用）
var arr [5]int = [5]int{1, 2, 3, 4, 5}

// 切片（动态数组，最常用！类似 Java 的 ArrayList）
s := []int{1, 2, 3, 4, 5}

// make 创建切片
s2 := make([]int, 5)     // 长度5，容量5
s3 := make([]int, 0, 10) // 长度0，容量10

// 追加元素（类似 ArrayList.add）
s = append(s, 6, 7, 8)

// 切片操作（类似 Python）
sub := s[1:3]  // [2, 3]（左闭右开）
sub2 := s[:3]  // [1, 2, 3]
sub3 := s[2:]  // [3, 4, 5, 6, 7, 8]

// 遍历
for i, v := range s {
    fmt.Printf("index=%d, value=%d\n", i, v)
}

// 只要值不要索引
for _, v := range s {
    fmt.Println(v)
}

// ⚠️ 切片是引用类型！
original := []int{1, 2, 3}
copied := original
copied[0] = 999
fmt.Println(original[0]) // 999！original 也被修改了

// 正确复制切片
safeCopy := make([]int, len(original))
copy(safeCopy, original)
```

> 💡 **Java 对照**：
> - Java `ArrayList` → Go `slice`（切片）
> - Java `Arrays.copyOf()` → Go `copy()`
> - 切片底层是数组引用，修改切片可能影响原数组！

#### 4.3 Map

```go
// 创建 Map（类似 Java 的 HashMap）
m := map[string]int{
    "apple":  5,
    "banana": 3,
}

// make 创建
m2 := make(map[string]int)

// CRUD 操作
m["cherry"] = 7           // 添加/更新
value := m["apple"]       // 读取
delete(m, "banana")       // 删除

// 判断 key 是否存在（Go 惯用法！）
value, exists := m["apple"]
if exists {
    fmt.Println("found:", value)
} else {
    fmt.Println("not found")
}

// 遍历（顺序不保证，和 Java HashMap 一样）
for key, value := range m {
    fmt.Printf("%s: %d\n", key, value)
}

// ⚠️ Map 是引用类型，nil map 不能写入
var nilMap map[string]int
// nilMap["key"] = 1 // panic! 必须先 make
nilMap = make(map[string]int)
nilMap["key"] = 1 // OK
```

> 💡 **Java 对照**：
> - Java `map.containsKey(k)` → Go `v, ok := m[k]`（两值返回）
> - Java `map.getOrDefault(k, def)` → Go 需要自己判断 ok
> - Go Map 不是线程安全的，并发用 `sync.Map`

#### 4.4 字符串深入

```go
// 字符串是只读的字节切片
s := "Hello, 世界"
fmt.Println(len(s))  // 13（字节数，不是字符数！）

// rune 类型处理 Unicode
for _, r := range s {
    fmt.Printf("%c ", r) // 正确遍历字符
}

// 字符串操作（strings 包）
import "strings"

strings.Contains("hello", "ell")     // true
strings.HasPrefix("hello", "hel")    // true
strings.Split("a,b,c", ",")         // ["a", "b", "c"]
strings.Join([]string{"a","b"}, "-") // "a-b"
strings.ToUpper("hello")            // "HELLO"
strings.TrimSpace("  hello  ")      // "hello"
strings.ReplaceAll("hello", "l", "r") // "herro"

// 高效字符串拼接（类似 Java StringBuilder）
var builder strings.Builder
for i := 0; i < 100; i++ {
    builder.WriteString("hello ")
}
result := builder.String()
```

#### 📝 Day 4 练习

- **必做**：实现一个 `WordCount` 函数，统计字符串中每个单词出现的次数，返回 `map[string]int`
- **必做**：实现 `removeDuplicates` 函数，用 map 去除切片中的重复元素
- **进阶**：实现一个简单的内存缓存 `Cache` 结构体，支持 `Set(key, value)`、`Get(key)`、`Delete(key)` 操作

---

### Day 5：并发编程（Go 最核心特色！）

**学习目标**：掌握 goroutine 和 channel，理解 Go 并发模型

#### 5.1 goroutine

```go
// 启动 goroutine（比 Java Thread 轻量 1000 倍！）
func sayHello(name string) {
    fmt.Println("Hello,", name)
}

// 关键字 go 启动并发
go sayHello("Alice")   // 异步执行
go sayHello("Bob")     // 异步执行
time.Sleep(time.Second) // 等待（生产环境不这么写）

// 匿名 goroutine
go func() {
    fmt.Println("anonymous goroutine")
}()

// goroutine 非常轻量，可以轻松启动数万个
for i := 0; i < 10000; i++ {
    go func(id int) {
        fmt.Println("goroutine", id)
    }(i) // 注意：传值避免闭包陷阱！
}
```

> 💡 **Java 对照**：
> - Java：`new Thread(() -> { ... }).start()` 或 `executor.submit(() -> { ... })`
> - Go：`go func() { ... }()`
> - goroutine 初始栈只有几 KB（Java Thread 通常 1MB），可以轻松创建数十万个

#### 5.2 Channel（goroutine 间通信）

```go
// 创建 channel
ch := make(chan string)    // 无缓冲 channel
bch := make(chan int, 10)  // 有缓冲 channel（容量10）

// 发送和接收
go func() {
    ch <- "hello" // 发送
}()
msg := <-ch // 接收（阻塞等待）
fmt.Println(msg)

// 实际应用：并发获取多个 URL
func fetchAll(urls []string) []string {
    ch := make(chan string, len(urls))
    
    for _, url := range urls {
        go func(u string) {
            resp, err := http.Get(u)
            if err != nil {
                ch <- fmt.Sprintf("error: %s", err)
                return
            }
            defer resp.Body.Close()
            ch <- fmt.Sprintf("%s: %d", u, resp.StatusCode)
        }(url)
    }
    
    results := make([]string, len(urls))
    for i := range urls {
        results[i] = <-ch
    }
    return results
}

// select 多路复用（类似 Java NIO 的 Selector）
select {
case msg := <-ch1:
    fmt.Println("from ch1:", msg)
case msg := <-ch2:
    fmt.Println("from ch2:", msg)
case <-time.After(3 * time.Second):
    fmt.Println("timeout!")
}
```

> 💡 **Go 并发哲学**：*"Don't communicate by sharing memory; share memory by communicating."*
> - Java 用锁（synchronized/Lock）保护共享数据
> - Go 优先用 channel 在 goroutine 间传递数据

#### 5.3 sync 包（共享内存方式）

```go
import "sync"

// WaitGroup（等待一组 goroutine 完成）
var wg sync.WaitGroup

for i := 0; i < 5; i++ {
    wg.Add(1)
    go func(id int) {
        defer wg.Done()
        fmt.Println("worker", id)
    }(i)
}
wg.Wait() // 等待所有 goroutine 完成

// Mutex 互斥锁（类似 Java 的 synchronized）
type SafeCounter struct {
    mu sync.Mutex
    count map[string]int
}

func (c *SafeCounter) Inc(key string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count[key]++
}

func (c *SafeCounter) Value(key string) int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.count[key]
}

// Once（只执行一次，类似 Java 的单例模式）
var once sync.Once
var instance *Database

func GetDB() *Database {
    once.Do(func() {
        instance = &Database{} // 只会执行一次
    })
    return instance
}
```

#### 5.4 常见并发模式

```go
// 模式1：Worker Pool（工作池）
func workerPool(jobs <-chan int, results chan<- int, workers int) {
    var wg sync.WaitGroup
    for i := 0; i < workers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range jobs {
                results <- job * 2 // 处理任务
            }
        }()
    }
    wg.Wait()
    close(results)
}

// 模式2：Fan-out / Fan-in
// Fan-out：多个 goroutine 从同一 channel 读取
// Fan-in：多个 channel 输出合并到一个 channel

// 模式3：Context 控制取消（类似 Java 的 Future.cancel）
func longTask(ctx context.Context) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err() // 被取消
        default:
            // 继续工作...
            time.Sleep(100 * time.Millisecond)
        }
    }
}

ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
go longTask(ctx)
```

#### 📝 Day 5 练习

- **必做**：用 goroutine + channel 实现并发下载 5 个 URL，收集所有结果
- **必做**：用 WaitGroup 启动 10 个 goroutine 并发计算 1-1000 的各段之和
- **进阶**：实现一个 Worker Pool，接收任务 channel，并发处理，结果写入结果 channel

---

### Day 6：包管理与项目结构

**学习目标**：掌握 Go Modules 和项目组织方式

#### 6.1 Go Modules

```bash
# 创建新项目
mkdir myproject && cd myproject
go mod init github.com/yourname/myproject

# 添加依赖
go get github.com/gin-gonic/gin@latest

# 整理依赖
go mod tidy

# 查看依赖
go list -m all
```

```
# go.mod 文件（类似 Java 的 pom.xml / build.gradle）
module github.com/yourname/myproject

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    gorm.io/gorm v1.25.5
)
```

#### 6.2 包（Package）

```go
// 包声明（每个目录一个包）
package user  // 文件 user/user.go

// 大写开头 = 导出（public）
func CreateUser(name string) *User { ... }

// 小写开头 = 私有（package-private）
func validateEmail(email string) bool { ... }

// 导入
import (
    "fmt"                                    // 标准库
    "github.com/gin-gonic/gin"              // 第三方
    "github.com/yourname/myproject/internal" // 内部包
)

// 包别名
import (
    userModel "github.com/yourname/myproject/model/user"
    userService "github.com/yourname/myproject/service/user"
)

// init 函数（包初始化，类似 Java 的 static 块）
func init() {
    // 包被导入时自动执行
    fmt.Println("package initialized")
}
```

#### 6.3 推荐项目结构

```
myproject/
├── cmd/                    # 程序入口
│   └── server/
│       └── main.go         # main 函数
├── internal/               # 内部包（其他项目不能导入）
│   ├── handler/            # HTTP 处理器（类似 Java Controller）
│   │   └── user.go
│   ├── service/            # 业务逻辑（类似 Java Service）
│   │   └── user.go
│   ├── repository/         # 数据访问（类似 Java DAO/Repository）
│   │   └── user.go
│   └── model/              # 数据模型（类似 Java Entity/DTO）
│       └── user.go
├── pkg/                    # 可被外部项目导入的公共包
│   └── util/
│       └── string.go
├── config/                 # 配置文件
│   └── config.yaml
├── go.mod                  # 依赖管理
├── go.sum                  # 依赖校验
├── Makefile                # 构建脚本
└── README.md
```

> 💡 **Java 对照**：
> - `cmd/` → Java 的 Application 入口类
> - `internal/handler/` → Java 的 Controller 层
> - `internal/service/` → Java 的 Service 层
> - `internal/repository/` → Java 的 DAO / Repository 层
> - `internal/model/` → Java 的 Entity / DTO
> - `pkg/` → Java 的 common/util 模块
> - `internal/` 是 Go 特有的，该目录下的包不能被外部项目导入

#### 📝 Day 6 练习

- **必做**：创建一个 Go Module 项目，包含 `cmd/`、`internal/model/`、`internal/service/` 目录结构
- **必做**：在 `model` 包定义 `User` 结构体，在 `service` 包实现 CRUD 操作（内存存储）
- **进阶**：添加一个第三方依赖（如 `github.com/google/uuid`），在项目中使用

---

### Day 7：标准库精选 + 第一周复习

**学习目标**：熟悉 Go 常用标准库，巩固第一周知识

#### 7.1 常用标准库

```go
// ============ fmt：格式化输出 ============
fmt.Println("hello")                    // 打印 + 换行
fmt.Printf("name: %s, age: %d\n", "Alice", 25) // 格式化
fmt.Sprintf("Hello, %s", name)          // 返回字符串
fmt.Fprintf(w, "HTTP Response")         // 写入 io.Writer

// ============ os：系统操作 ============
// 读写文件
data, err := os.ReadFile("config.yaml")
err = os.WriteFile("output.txt", []byte("hello"), 0644)

// 环境变量
port := os.Getenv("PORT")
if port == "" {
    port = "8080"
}

// 命令行参数
args := os.Args[1:] // 第一个是程序名

// ============ io：I/O 操作 ============
// 读取全部
body, err := io.ReadAll(resp.Body)

// 复制
io.Copy(dst, src)

// ============ encoding/json：JSON 处理 ============
type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email,omitempty"` // 空值省略
}

// 序列化（Marshal）
user := User{ID: 1, Name: "Alice"}
jsonBytes, err := json.Marshal(user)
// {"id":1,"name":"Alice"}

// 反序列化（Unmarshal）
var u User
err = json.Unmarshal(jsonBytes, &u)

// 美化输出
prettyJSON, _ := json.MarshalIndent(user, "", "  ")

// ============ net/http：HTTP 客户端/服务端 ============
// HTTP 客户端
resp, err := http.Get("https://api.example.com/users")
if err != nil {
    log.Fatal(err)
}
defer resp.Body.Close()
body, _ := io.ReadAll(resp.Body)

// POST 请求
jsonData, _ := json.Marshal(map[string]string{"name": "Alice"})
resp, err = http.Post("https://api.example.com/users",
    "application/json", bytes.NewBuffer(jsonData))

// HTTP 服务端（极简）
http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, World!")
})
log.Fatal(http.ListenAndServe(":8080", nil))

// ============ time：时间处理 ============
now := time.Now()
fmt.Println(now.Format("2006-01-02 15:04:05")) // Go 特有的时间格式化！

// ⚠️ Go 的时间格式模板是固定的参考时间：
// 2006-01-02 15:04:05 （记忆：1月2日下午3点4分5秒2006年）
duration := 5 * time.Second
time.Sleep(duration)

// 计时
start := time.Now()
doSomething()
elapsed := time.Since(start)
fmt.Printf("took %v\n", elapsed)

// ============ log：日志 ============
log.Println("info message")
log.Printf("user %s logged in", username)
log.Fatal("fatal error") // 打印 + os.Exit(1)

// 自定义 logger
logger := log.New(os.Stdout, "[APP] ", log.Ldate|log.Ltime|log.Lshortfile)
logger.Println("custom log message")

// ============ strconv：字符串转换 ============
i, err := strconv.Atoi("42")       // string → int
s := strconv.Itoa(42)              // int → string
f, err := strconv.ParseFloat("3.14", 64) // string → float64
```

> 💡 **Go 时间格式化的"魔法数字"**：`2006-01-02 15:04:05`
> 这不是随便写的！对应的是 Go 的参考时间 Mon Jan 2 15:04:05 MST 2006。
> 和 Java 的 `yyyy-MM-dd HH:mm:ss` 完全不同的思路。

#### 7.2 第一周复习清单

| 知识点 | 关键词 | 自检问题 |
|--------|--------|----------|
| 变量声明 | `:=`, `var`, 零值 | 能说出三种声明方式？知道零值机制？ |
| 控制流 | `for`, `range`, `switch` | Go 有 while 吗？switch 需要 break 吗？ |
| 函数 | 多返回值, `defer`, 闭包 | 为什么 Go 函数能返回多个值？ |
| 错误处理 | `error`, `nil`, `%w` | Go 为什么不用异常？如何包装错误？ |
| 结构体 | `struct`, 组合, `NewXxx()` | Go 如何实现"继承"？ |
| 接口 | 隐式实现, 鸭子类型 | 什么是隐式接口实现？空接口有什么用？ |
| 切片与 Map | `append`, `make`, 二值返回 | 切片和数组的区别？Map 如何判断 key 存在？ |
| 并发 | `goroutine`, `channel`, `sync` | goroutine 和 Java Thread 区别？ |
| 包管理 | `go mod`, 大小写访问控制 | Go 怎么控制可见性？ |

#### 📝 Day 7 练习

- **必做**：写一个命令行工具，读取 JSON 文件并美化输出
- **必做**：用 `net/http` 写一个最简单的 HTTP 服务，返回 JSON 响应
- **进阶**：实现一个 HTTP 客户端，调用公开 API（如天气 API），解析 JSON 响应并格式化输出

---

## 第二周：实战篇（Day 8-14）

---

### Day 8：Go Web 开发（net/http + Gin）

**学习目标**：掌握 Go Web 开发，学会使用 Gin 框架

#### 8.1 原生 net/http 服务

```go
package main

import (
    "encoding/json"
    "log"
    "net/http"
)

type Response struct {
    Code    int         `json:"code"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
}

func jsonResponse(w http.ResponseWriter, status int, data Response) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

func helloHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        jsonResponse(w, 405, Response{Code: 405, Message: "Method Not Allowed"})
        return
    }
    jsonResponse(w, 200, Response{Code: 200, Message: "OK", Data: "Hello, World!"})
}

func main() {
    http.HandleFunc("/hello", helloHandler)
    log.Println("Server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

#### 8.2 Gin 框架入门

```bash
go get github.com/gin-gonic/gin
```

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name" binding:"required"`
    Email string `json:"email" binding:"required,email"`
}

func main() {
    r := gin.Default() // 默认带 Logger 和 Recovery 中间件

    // GET 请求
    r.GET("/users/:id", func(c *gin.Context) {
        id := c.Param("id") // 路径参数
        c.JSON(http.StatusOK, gin.H{
            "id":   id,
            "name": "Alice",
        })
    })

    // POST 请求 + JSON 绑定
    r.POST("/users", func(c *gin.Context) {
        var user User
        if err := c.ShouldBindJSON(&user); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        c.JSON(http.StatusCreated, user)
    })

    // 查询参数
    r.GET("/search", func(c *gin.Context) {
        keyword := c.Query("q")           // 必填
        page := c.DefaultQuery("page", "1") // 带默认值
        c.JSON(http.StatusOK, gin.H{
            "keyword": keyword,
            "page":    page,
        })
    })

    // 路由分组
    api := r.Group("/api/v1")
    {
        api.GET("/users", listUsers)
        api.POST("/users", createUser)
        api.PUT("/users/:id", updateUser)
        api.DELETE("/users/:id", deleteUser)
    }

    r.Run(":8080")
}
```

> 💡 **Java 对照**：
> - Gin → Spring Boot（但 Gin 更轻量）
> - `c.ShouldBindJSON(&user)` → `@RequestBody User user`
> - `c.Param("id")` → `@PathVariable Long id`
> - `c.Query("q")` → `@RequestParam String q`
> - `r.Group("/api/v1")` → `@RequestMapping("/api/v1")`

#### 8.3 中间件

```go
// 自定义中间件（类似 Java 的 Filter / Interceptor）
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            c.Abort() // 终止请求链
            return
        }
        // 验证 token...
        c.Set("userID", 123) // 设置上下文值
        c.Next()             // 继续下一个 handler
    }
}

// 日志中间件
func LoggerMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        c.Next()
        latency := time.Since(start)
        log.Printf("[%s] %s %d %v",
            c.Request.Method, c.Request.URL.Path,
            c.Writer.Status(), latency)
    }
}

// 使用中间件
r.Use(LoggerMiddleware())           // 全局中间件
api := r.Group("/api", AuthMiddleware()) // 分组中间件
```

#### 📝 Day 8 练习

- **必做**：用 Gin 搭建一个 API 服务，实现 `/ping` 返回 `{"message": "pong"}`
- **必做**：实现用户 CRUD 的 4 个路由（内存存储），支持 JSON 请求/响应
- **进阶**：编写一个请求日志中间件，记录每个请求的方法、路径、状态码和耗时

---

### Day 9：数据库操作（database/sql + GORM）

**学习目标**：掌握 Go 数据库操作，学会使用 ORM 框架

#### 9.1 database/sql 原生操作

```go
import (
    "database/sql"
    _ "github.com/mattn/go-sqlite3" // SQLite 驱动
)

// 连接数据库
db, err := sql.Open("sqlite3", "app.db")
if err != nil {
    log.Fatal(err)
}
defer db.Close()

// 建表
_, err = db.Exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
    )
`)

// 插入（使用参数化查询防止 SQL 注入！）
result, err := db.Exec("INSERT INTO users (name, email) VALUES (?, ?)",
    "Alice", "alice@example.com")
id, _ := result.LastInsertId()

// 查询单行
var user User
err = db.QueryRow("SELECT id, name, email FROM users WHERE id = ?", id).
    Scan(&user.ID, &user.Name, &user.Email)

// 查询多行
rows, err := db.Query("SELECT id, name, email FROM users")
defer rows.Close()
for rows.Next() {
    var u User
    rows.Scan(&u.ID, &u.Name, &u.Email)
    users = append(users, u)
}
```

#### 9.2 GORM（Go 最流行的 ORM）

```bash
go get gorm.io/gorm
go get gorm.io/driver/sqlite
```

```go
import (
    "gorm.io/gorm"
    "gorm.io/driver/sqlite"
)

// 模型定义（类似 Java JPA @Entity）
type User struct {
    gorm.Model         // 内嵌：ID, CreatedAt, UpdatedAt, DeletedAt
    Name  string `gorm:"size:100;not null"`
    Email string `gorm:"uniqueIndex;not null"`
    Age   int    `gorm:"default:0"`
}

// 连接数据库
db, err := gorm.Open(sqlite.Open("app.db"), &gorm.Config{})
if err != nil {
    log.Fatal(err)
}

// 自动迁移（建表）
db.AutoMigrate(&User{})

// CRUD 操作

// Create
user := User{Name: "Alice", Email: "alice@example.com", Age: 25}
result := db.Create(&user)
fmt.Println(user.ID)       // 自动填充 ID
fmt.Println(result.Error)  // 错误信息
fmt.Println(result.RowsAffected)

// Read
var u User
db.First(&u, 1)                           // 按主键查找
db.First(&u, "email = ?", "alice@example.com") // 条件查找

var users []User
db.Where("age > ?", 18).Find(&users)      // 查找多个
db.Where("name LIKE ?", "%ali%").Find(&users)

// Update
db.Model(&user).Update("Name", "Bob")
db.Model(&user).Updates(User{Name: "Bob", Age: 30})
db.Model(&user).Updates(map[string]interface{}{"name": "Bob", "age": 30})

// Delete（软删除，因为有 gorm.Model）
db.Delete(&user, 1)

// 链式查询
var result []User
db.Where("age > ?", 18).
    Order("created_at desc").
    Limit(10).
    Offset(0).
    Find(&result)
```

> 💡 **Java 对照**：
> - GORM → JPA/Hibernate
> - `gorm.Model` → `@MappedSuperclass` + `@Id @GeneratedValue`
> - `db.Where().Find()` → JPA Criteria API / QueryDSL
> - `db.AutoMigrate()` → `spring.jpa.hibernate.ddl-auto=update`
> - **重要**：GORM 的查询参数也使用 `?` 占位符，防止 SQL 注入

#### 9.3 数据库最佳实践

```go
// 连接池配置（类似 Java 的 HikariCP）
sqlDB, _ := db.DB()
sqlDB.SetMaxIdleConns(10)
sqlDB.SetMaxOpenConns(100)
sqlDB.SetConnMaxLifetime(time.Hour)

// 事务
err := db.Transaction(func(tx *gorm.DB) error {
    if err := tx.Create(&user).Error; err != nil {
        return err // 回滚
    }
    if err := tx.Create(&order).Error; err != nil {
        return err // 回滚
    }
    return nil // 提交
})

// Repository 模式
type UserRepository struct {
    db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
    return &UserRepository{db: db}
}

func (r *UserRepository) FindByID(id uint) (*User, error) {
    var user User
    result := r.db.First(&user, id)
    if result.Error != nil {
        return nil, result.Error
    }
    return &user, nil
}

func (r *UserRepository) FindAll(page, pageSize int) ([]User, int64, error) {
    var users []User
    var total int64
    
    r.db.Model(&User{}).Count(&total)
    result := r.db.Offset((page - 1) * pageSize).Limit(pageSize).Find(&users)
    
    return users, total, result.Error
}
```

#### 📝 Day 9 练习

- **必做**：用 GORM + SQLite 实现 User 的增删改查
- **必做**：在 Day 8 的 Gin 项目中集成 GORM，让 API 操作真实数据库
- **进阶**：实现分页查询和条件搜索功能

---

### Day 10：Go 测试体系

**学习目标**：掌握 Go 的测试工具和最佳实践

#### 10.1 基础测试

```go
// calculator.go
package calc

func Add(a, b int) int {
    return a + b
}

func Divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("division by zero")
    }
    return a / b, nil
}
```

```go
// calculator_test.go（测试文件必须以 _test.go 结尾）
package calc

import "testing"

// 测试函数必须以 Test 开头
func TestAdd(t *testing.T) {
    result := Add(2, 3)
    if result != 5 {
        t.Errorf("Add(2, 3) = %d; want 5", result)
    }
}

// 表驱动测试（Go 最推荐的测试模式！）
func TestDivide(t *testing.T) {
    tests := []struct {
        name    string
        a, b    float64
        want    float64
        wantErr bool
    }{
        {"normal", 10, 2, 5, false},
        {"decimal", 7, 3, 2.3333333333333335, false},
        {"zero divisor", 10, 0, 0, true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := Divide(tt.a, tt.b)
            if (err != nil) != tt.wantErr {
                t.Errorf("Divide() error = %v, wantErr %v", err, tt.wantErr)
                return
            }
            if got != tt.want {
                t.Errorf("Divide() = %v, want %v", got, tt.want)
            }
        })
    }
}
```

```bash
# 运行测试
go test ./...              # 运行所有测试
go test -v ./...           # 详细输出
go test -run TestDivide    # 运行指定测试
go test -cover ./...       # 覆盖率
go test -coverprofile=coverage.out ./...  # 生成覆盖率文件
go tool cover -html=coverage.out          # 浏览器查看覆盖率
```

> 💡 **Java 对照**：
> - Go `testing` 包 → Java JUnit
> - 表驱动测试 → Java `@ParameterizedTest`
> - `go test` → `mvn test` / `gradle test`
> - Go 测试文件和源码在同一目录（Java 通常分 `src/main` 和 `src/test`）

#### 10.2 HTTP Handler 测试

```go
import (
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestHelloHandler(t *testing.T) {
    // 创建请求
    req := httptest.NewRequest("GET", "/hello", nil)
    // 创建响应记录器
    w := httptest.NewRecorder()
    
    // 调用 handler
    helloHandler(w, req)
    
    // 验证
    if w.Code != http.StatusOK {
        t.Errorf("status = %d; want %d", w.Code, http.StatusOK)
    }
    
    expected := `{"message":"hello"}`
    if w.Body.String() != expected {
        t.Errorf("body = %s; want %s", w.Body.String(), expected)
    }
}

// Gin 测试
func TestGinRoute(t *testing.T) {
    gin.SetMode(gin.TestMode)
    r := setupRouter() // 你的路由设置函数
    
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/ping", nil)
    r.ServeHTTP(w, req)
    
    if w.Code != 200 {
        t.Fatalf("expected 200, got %d", w.Code)
    }
}
```

#### 10.3 Benchmark 性能测试

```go
func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(1, 2)
    }
}
```

```bash
go test -bench=. -benchmem
```

#### 📝 Day 10 练习

- **必做**：为 Day 2 写的 calculator 函数编写表驱动测试
- **必做**：为 Day 8 的 Gin API 编写 HTTP 测试
- **进阶**：写 Benchmark 测试，比较字符串拼接用 `+` 和 `strings.Builder` 的性能差异

---

### Day 11-12：实战项目 —— Todo List RESTful API

**学习目标**：综合运用前10天所学，独立完成一个完整的 API 项目

#### 项目结构

```
todo-api/
├── cmd/
│   └── server/
│       └── main.go          # 程序入口
├── internal/
│   ├── handler/
│   │   └── todo.go          # HTTP 处理器
│   ├── middleware/
│   │   ├── logger.go        # 日志中间件
│   │   └── cors.go          # 跨域中间件
│   ├── model/
│   │   └── todo.go          # 数据模型
│   ├── repository/
│   │   └── todo.go          # 数据访问层
│   └── service/
│       └── todo.go          # 业务逻辑层
├── go.mod
├── go.sum
└── README.md
```

#### Day 11：搭建项目骨架 + CRUD

```go
// internal/model/todo.go
package model

import "gorm.io/gorm"

type Todo struct {
    gorm.Model
    Title       string `json:"title" gorm:"size:200;not null" binding:"required"`
    Description string `json:"description" gorm:"type:text"`
    Completed   bool   `json:"completed" gorm:"default:false"`
    Priority    int    `json:"priority" gorm:"default:0"` // 0=low, 1=medium, 2=high
}

type CreateTodoRequest struct {
    Title       string `json:"title" binding:"required,min=1,max=200"`
    Description string `json:"description"`
    Priority    int    `json:"priority" binding:"min=0,max=2"`
}

type UpdateTodoRequest struct {
    Title       *string `json:"title" binding:"omitempty,min=1,max=200"`
    Description *string `json:"description"`
    Completed   *bool   `json:"completed"`
    Priority    *int    `json:"priority" binding:"omitempty,min=0,max=2"`
}

type ListTodoQuery struct {
    Page      int    `form:"page,default=1" binding:"min=1"`
    PageSize  int    `form:"page_size,default=10" binding:"min=1,max=100"`
    Completed *bool  `form:"completed"`
    Keyword   string `form:"keyword"`
}
```

```go
// internal/repository/todo.go
package repository

import (
    "todo-api/internal/model"
    "gorm.io/gorm"
)

type TodoRepository struct {
    db *gorm.DB
}

func NewTodoRepository(db *gorm.DB) *TodoRepository {
    return &TodoRepository{db: db}
}

func (r *TodoRepository) Create(todo *model.Todo) error {
    return r.db.Create(todo).Error
}

func (r *TodoRepository) FindByID(id uint) (*model.Todo, error) {
    var todo model.Todo
    err := r.db.First(&todo, id).Error
    return &todo, err
}

func (r *TodoRepository) List(query model.ListTodoQuery) ([]model.Todo, int64, error) {
    var todos []model.Todo
    var total int64
    
    db := r.db.Model(&model.Todo{})
    
    if query.Completed != nil {
        db = db.Where("completed = ?", *query.Completed)
    }
    if query.Keyword != "" {
        db = db.Where("title LIKE ?", "%"+query.Keyword+"%")
    }
    
    db.Count(&total)
    
    offset := (query.Page - 1) * query.PageSize
    err := db.Offset(offset).Limit(query.PageSize).
        Order("priority DESC, created_at DESC").
        Find(&todos).Error
    
    return todos, total, err
}

func (r *TodoRepository) Update(todo *model.Todo) error {
    return r.db.Save(todo).Error
}

func (r *TodoRepository) Delete(id uint) error {
    return r.db.Delete(&model.Todo{}, id).Error
}
```

```go
// internal/handler/todo.go
package handler

import (
    "net/http"
    "strconv"
    "todo-api/internal/model"
    "todo-api/internal/repository"
    "github.com/gin-gonic/gin"
)

type TodoHandler struct {
    repo *repository.TodoRepository
}

func NewTodoHandler(repo *repository.TodoRepository) *TodoHandler {
    return &TodoHandler{repo: repo}
}

func (h *TodoHandler) Create(c *gin.Context) {
    var req model.CreateTodoRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    todo := &model.Todo{
        Title:       req.Title,
        Description: req.Description,
        Priority:    req.Priority,
    }
    
    if err := h.repo.Create(todo); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create todo"})
        return
    }
    
    c.JSON(http.StatusCreated, todo)
}

func (h *TodoHandler) GetByID(c *gin.Context) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
        return
    }
    
    todo, err := h.repo.FindByID(uint(id))
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "todo not found"})
        return
    }
    
    c.JSON(http.StatusOK, todo)
}

func (h *TodoHandler) List(c *gin.Context) {
    var query model.ListTodoQuery
    if err := c.ShouldBindQuery(&query); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    todos, total, err := h.repo.List(query)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list todos"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "data":      todos,
        "total":     total,
        "page":      query.Page,
        "page_size": query.PageSize,
    })
}

func (h *TodoHandler) Update(c *gin.Context) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
        return
    }
    
    todo, err := h.repo.FindByID(uint(id))
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "todo not found"})
        return
    }
    
    var req model.UpdateTodoRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    if req.Title != nil {
        todo.Title = *req.Title
    }
    if req.Description != nil {
        todo.Description = *req.Description
    }
    if req.Completed != nil {
        todo.Completed = *req.Completed
    }
    if req.Priority != nil {
        todo.Priority = *req.Priority
    }
    
    if err := h.repo.Update(todo); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update"})
        return
    }
    
    c.JSON(http.StatusOK, todo)
}

func (h *TodoHandler) Delete(c *gin.Context) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
        return
    }
    
    if err := h.repo.Delete(uint(id)); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete"})
        return
    }
    
    c.JSON(http.StatusNoContent, nil)
}
```

#### Day 12：完善项目 + 中间件 + 测试

```go
// internal/middleware/logger.go
package middleware

import (
    "log"
    "time"
    "github.com/gin-gonic/gin"
)

func Logger() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path
        method := c.Request.Method
        
        c.Next()
        
        latency := time.Since(start)
        status := c.Writer.Status()
        
        log.Printf("[%s] %s %d %v", method, path, status, latency)
    }
}
```

```go
// cmd/server/main.go
package main

import (
    "log"
    "todo-api/internal/handler"
    "todo-api/internal/middleware"
    "todo-api/internal/model"
    "todo-api/internal/repository"
    
    "github.com/gin-gonic/gin"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

func main() {
    // 初始化数据库
    db, err := gorm.Open(sqlite.Open("todo.db"), &gorm.Config{})
    if err != nil {
        log.Fatal("failed to connect database:", err)
    }
    db.AutoMigrate(&model.Todo{})
    
    // 初始化各层
    repo := repository.NewTodoRepository(db)
    h := handler.NewTodoHandler(repo)
    
    // 设置路由
    r := gin.New()
    r.Use(middleware.Logger(), gin.Recovery())
    
    api := r.Group("/api/v1")
    {
        api.POST("/todos", h.Create)
        api.GET("/todos", h.List)
        api.GET("/todos/:id", h.GetByID)
        api.PUT("/todos/:id", h.Update)
        api.DELETE("/todos/:id", h.Delete)
    }
    
    log.Println("Server starting on :8080")
    r.Run(":8080")
}
```

**API 测试命令：**

```bash
# 创建 Todo
curl -X POST http://localhost:8080/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Go","description":"Finish the 2-week plan","priority":2}'

# 列表查询
curl "http://localhost:8080/api/v1/todos?page=1&page_size=10"

# 按条件查询
curl "http://localhost:8080/api/v1/todos?completed=false&keyword=Go"

# 更新
curl -X PUT http://localhost:8080/api/v1/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# 删除
curl -X DELETE http://localhost:8080/api/v1/todos/1
```

#### 📝 Day 11-12 练习

- **必做**：按照上述结构完整实现 Todo List API
- **必做**：为 handler 编写至少 3 个 HTTP 测试用例
- **进阶**：添加 CORS 中间件、请求 ID 中间件、统一错误处理

---

### Day 13：Go 工程实践与工具链

**学习目标**：掌握 Go 的工程化工具和最佳实践

#### 13.1 代码格式化与检查

```bash
# 格式化（Go 强制统一风格！）
gofmt -w .        # 格式化所有文件
go fmt ./...      # 同上

# 代码检查
go vet ./...      # 官方静态分析

# 安装 golangci-lint（集成多种 linter）
brew install golangci-lint
golangci-lint run
```

#### 13.2 常用工具

```bash
# 构建
go build -o bin/server ./cmd/server/

# 交叉编译（Go 的杀手级特性！）
GOOS=linux GOARCH=amd64 go build -o bin/server-linux ./cmd/server/
GOOS=windows GOARCH=amd64 go build -o bin/server.exe ./cmd/server/

# 查看文档
go doc fmt.Println
go doc net/http

# 性能分析
go test -cpuprofile cpu.prof -memprofile mem.prof -bench .
go tool pprof cpu.prof
```

#### 13.3 Makefile

```makefile
.PHONY: build run test lint clean

APP_NAME := todo-api
BUILD_DIR := bin

build:
	go build -o $(BUILD_DIR)/$(APP_NAME) ./cmd/server/

run:
	go run ./cmd/server/

test:
	go test -v -cover ./...

lint:
	golangci-lint run

clean:
	rm -rf $(BUILD_DIR)
	rm -f todo.db

docker:
	docker build -t $(APP_NAME) .
```

#### 13.4 Dockerfile

```dockerfile
# 多阶段构建
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server/

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
```

> 💡 **Java 对照**：Go 编译成单个静态二进制文件，不需要 JVM！Docker 镜像可以非常小（~10MB vs Java 的 200MB+）。

#### 13.5 Go 代码规范要点

| 规则 | 说明 | 示例 |
|------|------|------|
| 命名 | 简短有意义，驼峰命名 | `userID` 而非 `userId`（ID 全大写） |
| 缩写 | 常见缩写全大写 | `HTTP`, `URL`, `ID`, `API` |
| 接口命名 | 单方法接口用 `-er` 后缀 | `Reader`, `Writer`, `Closer` |
| 错误变量 | `Err` 前缀 | `ErrNotFound`, `ErrTimeout` |
| 注释 | 导出符号必须有注释 | `// User represents a registered user.` |
| 包名 | 小写单词，不用下划线 | `package httputil`（不是 `http_util`） |

#### 📝 Day 13 练习

- **必做**：为 Todo API 项目添加 Makefile
- **必做**：运行 `go vet` 和 `golangci-lint` 修复所有警告
- **进阶**：编写 Dockerfile，构建并运行容器化的 API 服务

---

### Day 14：综合复习 + 进阶路线

**学习目标**：巩固两周所学，规划后续学习方向

#### 14.1 知识点自检清单

| 类别 | 知识点 | 掌握程度 |
|------|--------|----------|
| **基础** | 变量声明（:=, var）| ☐ |
| **基础** | 零值机制 | ☐ |
| **基础** | 控制流（for/range/switch）| ☐ |
| **函数** | 多返回值 | ☐ |
| **函数** | defer 用法 | ☐ |
| **函数** | 闭包 | ☐ |
| **错误** | error 接口 | ☐ |
| **错误** | 错误包装（%w）| ☐ |
| **错误** | panic/recover | ☐ |
| **类型** | struct 定义与方法 | ☐ |
| **类型** | interface 隐式实现 | ☐ |
| **类型** | 组合 vs 继承 | ☐ |
| **数据** | slice 操作 | ☐ |
| **数据** | map 操作 | ☐ |
| **数据** | 指针 | ☐ |
| **并发** | goroutine | ☐ |
| **并发** | channel | ☐ |
| **并发** | sync.WaitGroup/Mutex | ☐ |
| **并发** | context | ☐ |
| **工程** | Go Modules | ☐ |
| **工程** | 项目结构 | ☐ |
| **工程** | 测试（表驱动）| ☐ |
| **Web** | Gin 路由 + 中间件 | ☐ |
| **DB** | GORM CRUD | ☐ |

#### 14.2 进阶学习路线

```
两周基础 ──→ 你现在在这里！
     │
     ├──→ 深入并发（3-4周）
     │     ├── context 深入
     │     ├── errgroup
     │     ├── 并发模式（Pipeline, Fan-out/Fan-in）
     │     └── race condition 检测
     │
     ├──→ 微服务开发（4-6周）
     │     ├── gRPC + Protocol Buffers
     │     ├── 服务发现（Consul/Etcd）
     │     ├── 配置中心（Viper）
     │     └── 链路追踪（Jaeger）
     │
     ├──→ Go 高级特性（2-3周）
     │     ├── 泛型（Go 1.18+）
     │     ├── 反射（reflect）
     │     ├── unsafe 包
     │     └── CGO
     │
     ├──→ 性能优化（2-3周）
     │     ├── pprof 性能分析
     │     ├── 内存优化
     │     ├── GC 调优
     │     └── 零拷贝技术
     │
     └──→ 源码阅读
           ├── Go 标准库源码
           ├── Gin 源码
           └── etcd / Docker（Go 编写）源码
```

#### 14.3 推荐实战项目（两周后继续练手）

| 项目 | 技术点 | 难度 |
|------|--------|------|
| CLI 任务管理工具 | cobra, 文件I/O | ⭐⭐ |
| 短链接服务 | Redis, 62进制编码 | ⭐⭐⭐ |
| 聊天室 | WebSocket, goroutine | ⭐⭐⭐ |
| API 网关 | 反向代理, 中间件链 | ⭐⭐⭐⭐ |
| 分布式缓存 | 一致性哈希, gRPC | ⭐⭐⭐⭐ |

---

## Java 开发者常见陷阱清单

### 🔴 陷阱 1：切片是引用类型

```go
// ❌ 错误：以为 append 总是返回新切片
s := []int{1, 2, 3}
s2 := s[:2]
s2 = append(s2, 99)
fmt.Println(s) // [1, 2, 99]！s 被意外修改了

// ✅ 正确：需要独立副本时用 copy
s2 := make([]int, 2)
copy(s2, s[:2])
```

### 🔴 陷阱 2：goroutine 闭包变量捕获

```go
// ❌ 错误：所有 goroutine 共享同一个 i
for i := 0; i < 5; i++ {
    go func() {
        fmt.Println(i) // 可能全部打印 5
    }()
}

// ✅ 正确：通过参数传值
for i := 0; i < 5; i++ {
    go func(n int) {
        fmt.Println(n) // 正确打印 0-4
    }(i)
}
```

### 🔴 陷阱 3：nil interface 不等于 nil

```go
// ❌ 这是 Go 最经典的坑之一
var p *MyStruct = nil
var i interface{} = p
fmt.Println(i == nil) // false！

// 原因：interface 内部有 (type, value) 两个字段
// p 赋值给 i 后，i = (*MyStruct, nil)，type 不为空

// ✅ 正确做法
var i interface{} = nil // 直接赋 nil
fmt.Println(i == nil)   // true
```

### 🔴 陷阱 4：Map 不是线程安全的

```go
// ❌ 并发读写 map 会 panic
m := make(map[string]int)
go func() { m["a"] = 1 }()
go func() { _ = m["a"] }()
// fatal error: concurrent map read and map write

// ✅ 方案1：加锁
var mu sync.RWMutex
mu.Lock()
m["a"] = 1
mu.Unlock()

// ✅ 方案2：sync.Map
var sm sync.Map
sm.Store("a", 1)
v, ok := sm.Load("a")
```

### 🔴 陷阱 5：忘记处理 error

```go
// ❌ 忽略错误（Go 编码大忌）
result, _ := doSomething() // 千万不要这样！

// ✅ 始终处理错误
result, err := doSomething()
if err != nil {
    return fmt.Errorf("doSomething: %w", err)
}
```

### 🔴 陷阱 6：defer 在循环中的陷阱

```go
// ❌ 循环中 defer 可能导致资源泄漏
for _, file := range files {
    f, _ := os.Open(file)
    defer f.Close() // 所有文件在函数结束才关闭！
}

// ✅ 用匿名函数包裹
for _, file := range files {
    func() {
        f, _ := os.Open(file)
        defer f.Close()
        // 处理文件...
    }()
}
```

### 🔴 陷阱 7：字符串遍历的字节与字符

```go
s := "Hello, 世界"
// ❌ len(s) 返回字节数，不是字符数
fmt.Println(len(s)) // 13，不是 9

// ✅ 用 range 遍历 rune
for _, r := range s {
    fmt.Printf("%c", r) // 正确遍历字符
}

// ✅ 用 utf8 包获取字符数
fmt.Println(utf8.RuneCountInString(s)) // 9
```

---

## 推荐资源汇总

### 📚 必读

| 资源 | 类型 | 适合阶段 | 说明 |
|------|------|----------|------|
| [Go 官方教程 Tour of Go](https://go.dev/tour/) | 在线交互 | Day 1-3 | 官方交互式教程，2小时过一遍 |
| [Go by Example](https://gobyexample.com/) | 在线参考 | 全程 | 每个特性一个可运行示例 |
| [Effective Go](https://go.dev/doc/effective_go) | 官方文档 | Day 5+ | Go 编码最佳实践 |
| 《The Go Programming Language》 | 书籍 | 全程 | Go 圣经，系统学习必备 |

### 🎯 进阶

| 资源 | 类型 | 说明 |
|------|------|------|
| [Go Wiki](https://go.dev/wiki/) | 文档 | 官方 Wiki，包含大量最佳实践 |
| [Uber Go Style Guide](https://github.com/uber-go/guide/blob/master/style.md) | 规范 | Uber 的 Go 编码规范 |
| [Go Concurrency Patterns](https://go.dev/blog/pipelines) | 博客 | 官方并发模式讲解 |
| 《Concurrency in Go》 | 书籍 | 深入理解 Go 并发 |

### 🛠 工具

| 工具 | 用途 |
|------|------|
| [Go Playground](https://go.dev/play/) | 在线运行 Go 代码 |
| [pkg.go.dev](https://pkg.go.dev/) | Go 包文档搜索 |
| [golangci-lint](https://golangci-lint.run/) | 代码检查工具 |
| [Gin](https://gin-gonic.com/) | Web 框架文档 |
| [GORM](https://gorm.io/) | ORM 框架文档 |

---

## 每日学习时间分配建议

```
工作日（每天 2-3 小时）：
├── 30 min：阅读/看教程
├── 60 min：动手写代码/练习
├── 30 min：复习 + 记笔记
└── 30 min：看 Go by Example 补充

周末（每天 4-5 小时）：
├── 60 min：复习本周知识
├── 120 min：实战项目
├── 60 min：阅读源码/文章
└── 60 min：规划下周学习
```

---

> 💪 **写在最后**：作为一个有5年 Java 经验的开发者，你已经具备了扎实的编程基础。Go 的学习曲线对你来说会比较平缓。最大的挑战不是语法，而是**思维方式的转变**——从面向对象到组合优于继承，从异常到显式错误处理，从线程到 goroutine。保持"写代码"的习惯，每天至少写 50 行 Go 代码，两周后你一定能上手！
