document.addEventListener('DOMContentLoaded', () => {
    const categoriesList = document.getElementById('categoriesList');
    const noCategoriesMessage = document.getElementById('noCategoriesMessage');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const categoryModalElement = document.getElementById('categoryModal');
    const categoryModal = new bootstrap.Modal(categoryModalElement);
    const categoryModalTitle = document.getElementById('categoryModalTitle');
    const categoryForm = document.getElementById('categoryForm');
    const categoryIdInput = document.getElementById('categoryId');
    const categoryNameInput = document.getElementById('categoryName');
    const saveCategoryBtn = document.getElementById('saveCategoryBtn');

    // 加載分類列表
    async function loadCategories() {
        try {
            const categories = await Database.getAllCategories();
            categoriesList.innerHTML = ''; // 清空列表

            if (categories.length === 0) {
                noCategoriesMessage.style.display = 'block';
                categoriesList.style.display = 'none';
            } else {
                noCategoriesMessage.style.display = 'none';
                categoriesList.style.display = 'block';
                categories.forEach(category => {
                    const listItem = document.createElement('div');
                    listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                    listItem.innerHTML = `
                        <span>${escapeHtml(category.name)}</span>
                        <div>
                            <button class="btn btn-outline-primary btn-sm me-2 edit-btn" data-id="${category.id}" data-name="${escapeHtml(category.name)}">
                                <i class="bi bi-pencil"></i> 編輯
                            </button>
                            <button class="btn btn-outline-danger btn-sm delete-btn" data-id="${category.id}">
                                <i class="bi bi-trash"></i> 刪除
                            </button>
                        </div>
                    `;
                    categoriesList.appendChild(listItem);
                });
            }
        } catch (error) {
            console.error('加載分類列表失敗:', error);
            alert('加載分類列表失敗，請稍後再試');
        }
    }

    // HTML 轉義函數，防止 XSS
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }

    // 打開新增分類 Modal
    addCategoryBtn.addEventListener('click', () => {
        categoryForm.reset();
        categoryIdInput.value = '';
        categoryModalTitle.textContent = '新增分類';
        categoryModal.show();
    });

    // 儲存分類（新增或編輯）
    saveCategoryBtn.addEventListener('click', async () => {
        const id = categoryIdInput.value;
        const name = categoryNameInput.value.trim();

        if (!name) {
            alert('請輸入分類名稱');
            return;
        }

        try {
            if (id) {
                // 編輯模式
                await Database.updateCategory(parseInt(id), name);
            } else {
                // 新增模式
                await Database.addCategory(name);
            }
            categoryModal.hide();
            await loadCategories(); // 重新加載列表
        } catch (error) {
            console.error('儲存分類失敗:', error);
            alert(`儲存分類失敗: ${error.message}`);
        }
    });

    // 列表按鈕事件委派 (編輯/刪除)
    categoriesList.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const categoryId = parseInt(target.dataset.id);

        if (target.classList.contains('edit-btn')) {
            // 編輯按鈕
            const categoryName = target.dataset.name;
            categoryIdInput.value = categoryId;
            categoryNameInput.value = categoryName;
            categoryModalTitle.textContent = '編輯分類';
            categoryModal.show();
        } else if (target.classList.contains('delete-btn')) {
            // 刪除按鈕
            if (confirm('確定要刪除這個分類嗎？')) {
                try {
                    await Database.deleteCategory(categoryId);
                    await loadCategories(); // 重新加載列表
                } catch (error) {
                    console.error('刪除分類失敗:', error);
                    alert(`刪除分類失敗: ${error.message}`);
                }
            }
        }
    });

    // 初始加載
    loadCategories();
}); 