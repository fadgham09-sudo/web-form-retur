/**
 * ============================================================
 * 4_Frontend_Logic.js
 * OUTPUT: Integrasi API Apps Script & Manipulasi Form UI
 * ============================================================
 */

// TODO: MASUKKAN URL WEB APP ANDA DI SINI
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyIkeTglGcowMwb9l7mQ6BZFpgk9r6CV2Z-m3rM5OaXAafwiF6t2181NrwZ0vpRrLq7Jg/exec";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("main-form");
  const actionInput = document.getElementById("input-action");
  const btnSubmit = document.getElementById("submit-btn");
  const identitasSection = document.getElementById("identitas-section");
  const nomorInput = document.getElementById("nomor_pemesanan");
  const alertBox = document.getElementById("alert-box");
  
  const step1 = document.getElementById("step-1");
  const step2 = document.getElementById("step-2");

  // LOGIKA AUTOCOMPLETE & VALIDASI DATABASE JSON
  const autocompleteList = document.getElementById("autocomplete-list");
  let validNumbers = [];
  // 1. Ambil data dari JSON saat halaman pertama dimuat
  async function loadValidNumbers() {
    try {
      const response = await fetch('data_nomor.json');
      const rawData = await response.json();
      
      // Membongkar array dua dimensi (contoh: [["123"], ["456"]]) 
      // menjadi daftar tunggal (contoh: ["123", "456"])
      if (rawData && rawData.data) {
        validNumbers = rawData.data.map(row => row[0].toString());
      }
      
    } catch (error) {
      console.error("Gagal memuat database nomor:", error);
    }
  }
  loadValidNumbers();
  // 2. Filter data saat pengguna mengetik
  nomorInput.addEventListener("input", function () {
    const val = this.value.trim();
    autocompleteList.innerHTML = "";
    autocompleteList.classList.add("hidden");
    if (!val) return;
    // Cari nomor yang mengandung kombinasi angka yang diketik (dibatasi 5 hasil agar rapi)
    const filtered = validNumbers.filter(num => num.includes(val)).slice(0, 5);

    if (filtered.length > 0) {
      autocompleteList.classList.remove("hidden");
      
      filtered.forEach(num => {
        const div = document.createElement("div");
        // Beri efek tebal pada angka yang cocok
        const regex = new RegExp(`(${val})`, "gi");
        div.innerHTML = num.replace(regex, "<strong>$1</strong>");
        
        // Saat diklik, masukkan angka ke input
        div.addEventListener("click", function () {
          nomorInput.value = num;
          autocompleteList.innerHTML = "";
          autocompleteList.classList.add("hidden");
        });
        autocompleteList.appendChild(div);
      });
    }
  });

  // 3. Tutup dropdown jika area lain di layar diklik
  document.addEventListener("click", function (e) {
    if (e.target !== nomorInput) {
      autocompleteList.innerHTML = "";
      autocompleteList.classList.add("hidden");
    }
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    
    // UI State: Loading
    const originalBtnText = btnSubmit.innerText;
    btnSubmit.innerText = "Memproses, mohon tunggu...";
    btnSubmit.disabled = true;
    showAlert("", "hidden");

    // Persiapkan Data Form
    const formData = new FormData(form);
    const dataObj = Object.fromEntries(formData.entries());

    // Validasi 1: Pastikan 20 digit
    const nomorDiketik = dataObj.nomor_pemesanan.trim();
    if (nomorDiketik.length !== 20) {
      showAlert("Nomor Pemesanan harus tepat 20 digit.", "error");
      btnSubmit.innerText = originalBtnText;
      btnSubmit.disabled = false;
      return; 
    }

    // Validasi 2: Pastikan nomor terdaftar di database JSON
    // (Abaikan pengecekan ini jika pengguna sedang menyimpan identitas / action = simpan)
    if (actionInput.value === "cek" && !validNumbers.includes(nomorDiketik)) {
      showAlert("Nomor Pemesanan tidak terdaftar di database. Silakan periksa kembali.", "error");
      btnSubmit.innerText = originalBtnText;
      btnSubmit.disabled = false;
      return; 
    }

    try {
      // POST Fetch ke Google Apps Script
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: new URLSearchParams(dataObj),
        redirect: "follow"
      });

      const result = await response.json();
      handleResponse(result);

    } catch (error) {
      showAlert("Gagal terhubung ke server. Pastikan koneksi internet Anda stabil.", "error");
    } finally {
      btnSubmit.innerText = originalBtnText;
      btnSubmit.disabled = false;
    }
  });

  // Logika Mengelola Balasan dari Apps Script
  function handleResponse(res) {
    const actionState = actionInput.value;

    if (actionState === "cek") {
      if (res.status === "sudah_terdata") {
        showAlert(res.pesan, "error");
      } else if (res.status === "belum_terdata") {
        // Pindah ke State 2: Isi Identitas
        showAlert(res.pesan, "success");
        
        nomorInput.readOnly = true;
        identitasSection.classList.remove("hidden");
        
        // Ubah Indikator Step Panel Kiri
        step1.classList.remove("active");
        step2.classList.add("active");

        actionInput.value = "simpan";
        btnSubmit.innerText = "Simpan Konfirmasi Retur";
      } else {
        showAlert(res.pesan, "error");
      }
    } 
    else if (actionState === "simpan") {
      if (res.status === "success") {
        showAlert("Berhasil! " + res.pesan, "success");
        
        // Reset Form ke awal
        form.reset();
        identitasSection.classList.add("hidden");
        nomorInput.readOnly = false;
        
        step2.classList.remove("active");
        step1.classList.add("active");

        actionInput.value = "cek";
        btnSubmit.innerText = "Cek Nomor Pemesanan";
      } else {
        showAlert(res.pesan, "error");
      }
    }
  }

  function showAlert(message, type) {
    alertBox.innerText = message;
    alertBox.className = "alert " + type;
  }
});
