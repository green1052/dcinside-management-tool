import * as cheerio from "cheerio";

export class Article {
    public id: string;
    public subject?: string;
    public title: string;
    public iconType: string;
    public date: Date;
    public views: string;
    public upvote?: number;
    public user: string;


    constructor(
        private $: cheerio.Cheerio<cheerio.Element>
    ) {
        this.id = String(this.$.data("no"));
        this.subject = this.$.children(".gall_subject").text();
        this.title = this.$.children(".gall_tit").text().trim().split("\n")[0];
        this.iconType = String(this.$.data("type"));
        this.date = new Date(this.$.children(".gall_date").attr("title")!) ?? "ERROR";
        this.views = this.$.children(".gall_count").text();
        this.upvote = Number(this.$.children(".gall_recommend").text());
        this.user = "";
    }
}