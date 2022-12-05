export class TransferDataService {
  private data: any;

  setData(data: any) {
    this.data = data;
  }

  checkData() {
    return this.data ? true : false;
  }

  getData() {
    const temp = this.data;
    this.clearData();
    return temp;
  }

  clearData() {
    this.data = null;
  }
}
